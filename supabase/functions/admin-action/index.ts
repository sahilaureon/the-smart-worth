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
    const { action, table, payload, query } = await req.json()

    let result;
    let error;

    switch (action) {
      case 'query':
        let q = adminClient.from(table).select(query?.select || '*')
        if (query?.eq) {
          q = q.eq(query.eq.column, query.eq.value)
        }
        if (query?.order) {
          q = q.order(query.order.column, { ascending: query.order.ascending })
        }
        const { data: queryData, error: queryError } = await q
        result = queryData
        error = queryError
        break;
      case 'update':
        const { data: updateData, error: updateError } = await adminClient
          .from(table)
          .update(payload.data)
          .eq('id', payload.id)
        result = updateData
        error = updateError
        break;
      case 'insert':
        const { data: insertData, error: insertError } = await adminClient
          .from(table)
          .insert(payload)
        result = insertData
        error = insertError
        break;
      case 'delete':
        const { data: deleteData, error: deleteError } = await adminClient
          .from(table)
          .delete()
          .eq('id', payload.id)
        result = deleteData
        error = deleteError
        break;
      case 'delete-user':
        const { error: authError } = await adminClient.auth.admin.deleteUser(payload.id)
        if (authError) throw authError
        const { error: profError } = await adminClient.from('profiles').delete().eq('id', payload.id)
        result = { success: true }
        error = profError
        break;
      case 'create-user':
        // 1. Create Auth User
        const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
          email: payload.email,
          password: payload.password,
          email_confirm: true,
          user_metadata: { full_name: payload.full_name }
        });
        
        if (createAuthError) throw createAuthError;
        if (!authData.user) throw new Error('Failed to create auth user');

        // Generate TSW ID
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const tswId = `TSW${randomNum}`;

        // 2. Update/Upsert profile (Handling trigger latency)
        // Wait a bit or use upsert
        const { error: profileUpsertError } = await adminClient
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: payload.email,
            full_name: payload.full_name,
            role: payload.role || 'user',
            package_id: payload.package_id,
            tsw_id: tswId,
            is_verified: true
          });
          
        if (profileUpsertError) throw profileUpsertError;
        
        result = { success: true, user: authData.user };
        break;
      default:
        throw new Error('Invalid action')
    }

    if (error) throw error

    return new Response(JSON.stringify(result), {
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
