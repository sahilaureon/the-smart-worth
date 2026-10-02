import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { getOrderEmail, getWithdrawalEmail, getAuthEmail } from "../_shared/templates.ts";
import { generateEdgeReceiptPdfBytes, uint8ArrayToBase64 } from "../_shared/pdfGenerator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, data, emailType } = await req.json();

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "helplinesmartworth@gmail.com";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let html = "";
    let subject = "";
    let to = "";
    let pdfBase64 = "";
    let pdfFilename = "";

    if (type === "order") {
      html = getOrderEmail(data);
      const isPaid = data.status === "successful" || data.status === "paid";
      const orderNum = data.order_number || `TSW-${Date.now().toString().slice(-5)}`;
      subject = isPaid
        ? `Official Payment Receipt #${orderNum} - THE SMART WORTH`
        : `Order #${orderNum} Unsuccessful - THE SMART WORTH`;
      to = data.customer_email || data.email;

      const finalAmount = Number(data.total ?? data.subtotal ?? data.price ?? 599);
      const originalPrice = Math.max(Number(data.original_price ?? data.price ?? finalAmount), finalAmount);
      const discountAmount = Number(data.discount_amount ?? Math.max(0, originalPrice - finalAmount));

      const pdfBytes = generateEdgeReceiptPdfBytes({
        invoiceNumber: `#${orderNum}`,
        orderId: String(data.order_id || data.razorpay_order_id || orderNum),
        paymentId: String(data.payment_id || data.razorpay_payment_id || "Verified"),
        dateStr: new Date(data.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        status: isPaid ? "PAID & VERIFIED" : "UNSUCCESSFUL",
        packageName: String(data.product_name || data.package_name || "VIP Learning Package"),
        originalPrice,
        discountAmount,
        finalAmount,
        paymentMethod: String(data.payment_method || "UPI QR Code (The Smart Worth Pay)"),
        customerName: String(data.customer_name || "Valued Student"),
        username: String(data.username || (to || "student").split("@")[0]),
        customerEmail: String(to || ""),
        customerPhone: String(data.customer_phone || ""),
        billingAddress: String(data.billing_address || "India"),
        referralCode: String(data.referral_code || ""),
        websiteName: "The Smart Worth",
        websiteUrl: "https://thesmartworth.site",
        ownerName: "Sahil Aureon",
        ownerEmail: "helplinesmartworth@gmail.com"
      });

      pdfBase64 = uint8ArrayToBase64(pdfBytes);
      pdfFilename = `TheSmartWorth-Receipt-${orderNum.replace("#", "")}.pdf`;
    } else if (type === "withdrawal") {
      html = getWithdrawalEmail(data);
      subject = `Withdrawal Request ${String(data.status || "").toUpperCase()} - THE SMART WORTH`;
      to = data.customer_email || data.email;
    } else if (type === "auth") {
      html = getAuthEmail(emailType, data);
      subject = emailType === "welcome" ? "Welcome to THE SMART WORTH" : "Account Notification";
      to = data.email;
    }

    if (resendApiKey && to) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `The Smart Worth <${smtpFrom}>`,
          to: [to, "helplinesmartworth@gmail.com"],
          subject,
          html,
          attachments: pdfBase64
            ? [{ filename: pdfFilename, content: pdfBase64 }]
            : undefined
        })
      });
    }

    if (smtpHost && smtpUser && smtpPass && to) {
      const client = new SmtpClient();
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass
      });

      await client.send({
        from: smtpFrom,
        to,
        subject,
        content: subject,
        html
      });

      await client.close();
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipient: to,
        pdf_filename: pdfFilename || null,
        pdf_base64: pdfBase64 || null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
