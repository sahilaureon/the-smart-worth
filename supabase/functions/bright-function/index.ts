import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseServiceKey) {
      console.error("[ERROR] SUPABASE_SERVICE_ROLE_KEY is missing");
      throw new Error("Server configuration error: Service key missing");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Parse Request Body First (to check for pre-signup flag)
    const body = await req.json().catch(() => ({}));
    console.log("[DEBUG] Request body:", JSON.stringify(body));
    
    const is_pre_signup = body.is_pre_signup === true;
    const raw_package_id = body.package_id;
    const referral_code = body.referral_code?.trim().toUpperCase();
    
    let user = null;

    // 2. Verify User Authentication (if not pre-signup)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authUser) {
          user = authUser;
          console.log(`[DEBUG] Authenticated user: ${user.id} (${user.email})`);
        }
      }
    }

    // If not pre-signup and no user, then it's unauthorized
    if (!is_pre_signup && !user) {
      console.error("[ERROR] Unauthorized access attempt");
      return new Response(JSON.stringify({ error: "Unauthorized: Please login or provide registration details" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // For pre-signup, we need at least an email
    if (is_pre_signup && !body.email) {
      return new Response(JSON.stringify({ error: "Email is required for registration" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!raw_package_id) {
      return new Response(JSON.stringify({ error: "package_id is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 3. Fetch Package Details
    console.log(`[DEBUG] Fetching package: ${raw_package_id}`);
    let query = supabaseAdmin.from("packages").select("*");
    
    if (!isNaN(Number(raw_package_id))) {
      query = query.eq("id", Number(raw_package_id));
    } else {
      query = query.eq("id", raw_package_id);
    }
    
    const { data: pkg, error: pkgError } = await query.maybeSingle();

    if (pkgError || !pkg) {
      console.error("[ERROR] Package fetch failed:", pkgError?.message || "Not found");
      return new Response(JSON.stringify({ error: "Package not found", details: pkgError?.message }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 4. Calculate Price & Apply Referral Discount
    let originalPrice = Number(pkg.offer_price ?? pkg.price);
    let finalPrice = originalPrice;
    let discountApplied = 0;
    let referrerId = null;

    console.log(`[DEBUG] Base price: ${originalPrice}`);
    
    if (referral_code) {
      console.log(`[DEBUG] Validating referral code: ${referral_code}`);
      const { data: referrer, error: refError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', referral_code)
        .maybeSingle();
      
      if (referrer && !refError) {
        // Prevent self-referral
        if (referrer.id === user.id) {
          console.warn(`[WARN] Self-referral attempt by user: ${user.id}`);
        } else {
          referrerId = referrer.id;
          discountApplied = Math.round(originalPrice * 0.20); // 20% Discount
          finalPrice = originalPrice - discountApplied;
          console.log(`[DEBUG] Referral applied. Referrer: ${referrerId}, Discount: ${discountApplied}, Final: ${finalPrice}`);
        }
      } else {
        console.warn(`[WARN] Invalid referral code: ${referral_code}`);
      }
    }

    const amountInPaise = Math.round(finalPrice * 100);
    if (amountInPaise <= 0) {
      throw new Error("Invalid final amount");
    }

    // 5. Initialize Razorpay & Create Order
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay keys missing in environment");
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const identifier = user ? user.id : body.email;
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${identifier.substring(0, 8)}`,
      notes: {
        package_id: String(raw_package_id),
        user_id: user ? user.id : "pre_signup",
        email: body.email || (user ? user.email : ""),
        referral_code: referral_code || "",
        referrer_id: referrerId || "",
        discount_applied: String(discountApplied),
        original_price: String(originalPrice),
        is_pre_signup: String(is_pre_signup)
      }
    };

    console.log("[DEBUG] Creating Razorpay order...");
    const order = await razorpay.orders.create(options);
    console.log(`[DEBUG] Order created: ${order.id}`);

    // 6. Log Order to DB
    try {
      // Only insert fields that exist in the table schema
      await supabaseAdmin.from("razorpay_orders").insert({
        user_id: user ? user.id : null,
        email: body.email || (user ? user.email : null),
        package_id: String(raw_package_id),
        razorpay_order_id: order.id,
        amount: finalPrice,
        currency: "INR",
        status: "created",
        referral_code: referral_code || null,
        is_pre_signup: is_pre_signup
      });
    } catch (dbErr) {
      console.warn("[WARN] DB log failed:", dbErr);
    }

    return new Response(JSON.stringify({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId,
      original_price: originalPrice,
      discount: discountApplied,
      final_price: finalPrice
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[CRITICAL ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
