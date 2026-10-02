import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const signature = req.headers.get("x-razorpay-signature");
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

    if (!signature || !secret) {
      return new Response(JSON.stringify({ error: "Missing signature or secret" }), { status: 400 });
    }

    const bodyText = await req.text();
    
    // Verify Signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(bodyText)
    );

    if (!isValid) {
      console.error("[WEBHOOK] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
    }
    
    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const orderId = payload.payload.payment.entity.order_id;
    const paymentId = payload.payload.payment.entity.id;
    const notes = payload.payload.payment.entity.notes;

    console.log(`[WEBHOOK] Event: ${event}, Order: ${orderId}`);

    if (event === "payment.captured") {
      const userId = notes.user_id;
      const email = notes.email;
      const packageId = notes.package_id;
      const referrerId = notes.referrer_id;
      const isPreSignup = notes.is_pre_signup === "true";
      const amount = payload.payload.payment.entity.amount / 100; // Convert from paise

      // 1. Update Order Status
      await supabaseAdmin
        .from("razorpay_orders")
        .update({ 
          status: "paid", 
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          email: email
        })
        .eq("razorpay_order_id", orderId);

      // 2. Update User Profile (Grant Access) - Only if user already exists
      if (userId && userId !== "pre_signup") {
        await supabaseAdmin
          .from("profiles")
          .update({ package_id: packageId })
          .eq("id", userId);
      }

        // 3. Handle Referral Commission
        if (referrerId && referrerId !== "") {
          const totalCommission = amount * 0.70; // 70% of total
          const walletCredit = totalCommission * 0.50; // 50% of commission to wallet

          console.log(`[REFERRAL] Referrer: ${referrerId}, Total Comm: ${totalCommission}, Wallet: ${walletCredit}`);

          try {
            // Record Referral
            const { error: refError } = await supabaseAdmin.from("referrals").insert({
              referrer_id: referrerId,
              referred_id: userId === "pre_signup" ? null : userId,
              package_id: packageId,
              order_id: orderId,
              payment_id: paymentId,
              amount: amount,
              commission_earned: totalCommission,
              status: "completed"
            });

            if (refError) {
              console.error("[WEBHOOK] Referral record failed:", refError.message);
              if (refError.message.includes('referred_id')) {
                console.error("[CRITICAL] Database schema mismatch: referred_id column missing in referrals table.");
              }
            }

            // Credit Wallet
            const { data: profile, error: profError } = await supabaseAdmin
              .from("profiles")
              .select("wallet_balance")
              .eq("id", referrerId)
              .maybeSingle();

            if (!profError && profile) {
              const newBalance = (profile.wallet_balance || 0) + walletCredit;

              await supabaseAdmin
                .from("profiles")
                .update({ wallet_balance: newBalance })
                .eq("id", referrerId);

              // Record Transaction
              await supabaseAdmin.from("transactions").insert({
                user_id: referrerId,
                amount: walletCredit,
                type: "credit",
                category: "referral",
                description: `Referral commission for order ${orderId}`
              });
            }
          } catch (refProcError: any) {
            console.error("[WEBHOOK] Referral processing error:", refProcError.message);
          }
        }

        // 4. Trigger Automated Edge Function to send PDF Receipt Email to Registered Email
        try {
          await supabaseAdmin.functions.invoke("send-payment-receipt", {
            body: {
              order_id: orderId,
              payment_id: paymentId,
              customer_email: email || payload.payload.payment.entity.email,
              customer_name: notes?.customer_name || notes?.full_name || "Valued Student",
              username: notes?.username || "",
              customer_phone: payload.payload.payment.entity.contact || "",
              package_name: notes?.package_name || "VIP Learning Package",
              amount,
              status: "successful",
              payment_method: "UPI QR Code (The Smart Worth Pay)"
            }
          });
        } catch (fnErr: any) {
          console.warn("[WEBHOOK] Edge Function receipt trigger warning:", fnErr?.message);
        }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("[WEBHOOK ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
