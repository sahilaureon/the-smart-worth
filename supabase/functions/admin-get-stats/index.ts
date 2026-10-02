import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || profile?.role !== 'admin') {
      if (user.email !== 'helplinesmartworth@gmail.com') {
        throw new Error('Unauthorized: Admin access required')
      }
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Parallel fetch for stats
    const [
      { count: userCount },
      { data: recentUsersRaw },
      { data: txs },
      { count: pendingPayouts },
      { count: pendingProfileRequests },
      { data: recentTxs },
      { count: activeCount },
      { count: courseCount }
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      adminClient.from('transactions').select('*'),
      adminClient.from('payouts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      adminClient.from('profile_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      adminClient.from('transactions').select('*').order('created_at', { ascending: false }).limit(5),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
      adminClient.from('courses').select('*', { count: 'exact', head: true })
    ])

    // Process earnings
    const earnings = txs?.filter((t: any) => t.category === 'referral' && t.status === 'completed')
                        .reduce((acc, t: any) => acc + t.amount, 0) || 0;

    // Fetch package names for recent users
    const recentUsers = await Promise.all((recentUsersRaw || []).map(async (u: any) => {
      if (u.package_id) {
        const { data: pkg } = await adminClient
          .from('packages')
          .select('name')
          .eq('id', u.package_id)
          .maybeSingle();
        return { ...u, package_name: pkg?.name || 'No Package' };
      }
      return { ...u, package_name: 'No Package' };
    }));

    return new Response(JSON.stringify({
      totalUsers: userCount || 0,
      totalEarnings: earnings,
      activePackages: activeCount || 0,
      totalCourses: courseCount || 0,
      pendingWithdrawals: (pendingPayouts || 0) + (pendingProfileRequests || 0),
      recentTransactions: recentTxs || [],
      recentUsers: recentUsers || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
