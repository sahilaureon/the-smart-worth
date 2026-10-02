import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { getOrderEmail } from "../_shared/templates.ts";
import {
  generateEdgeReceiptPdfBytes,
  uint8ArrayToBase64,
  ReceiptPdfData
} from "../_shared/pdfGenerator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const orderId = String(body.order_id || body.orderId || `order_${Date.now()}`);
    const paymentId = String(body.payment_id || body.paymentId || "");
    const shortDigits = orderId.replace(/\D/g, "").slice(-5) || String(Date.now()).slice(-5);
    const invoiceNumber = String(body.invoice_number || body.order_number || `#TSW-${shortDigits}`);
    const customerEmail = String(body.customer_email || body.email || "").trim().toLowerCase();
    const customerName = String(body.customer_name || body.full_name || "Valued Student");
    const username = String(body.username || customerEmail.split("@")[0] || "student");
    const customerPhone = String(body.customer_phone || body.mobile || "");
    const billingAddress = String(
      body.billing_address ||
        [body.city, body.state, body.pin_code].filter(Boolean).join(", ") ||
        "India"
    );
    const packageName = String(body.package_name || body.product_name || "VIP Learning Package");
    const finalAmount = Number(body.amount ?? body.total ?? body.finalAmount ?? 599);
    const originalPrice = Math.max(
      Number(body.original_price ?? body.price ?? finalAmount),
      finalAmount
    );
    const discountAmount = Number(
      body.discount_amount ?? Math.max(0, originalPrice - finalAmount)
    );
    const referralCode = String(body.referral_code || "");
    const status = body.status === "failed" ? "failed" : "successful";

    if (!customerEmail || !customerEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid registered customer email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const receiptData: ReceiptPdfData = {
      invoiceNumber,
      orderId,
      paymentId,
      dateStr,
      status: status === "successful" ? "PAID & VERIFIED" : "UNSUCCESSFUL",
      packageName,
      originalPrice,
      discountAmount,
      finalAmount,
      paymentMethod: body.payment_method || "UPI QR Code (The Smart Worth Pay)",
      customerName,
      username,
      customerEmail,
      customerPhone,
      billingAddress,
      referralCode,
      websiteName: "The Smart Worth",
      websiteUrl: "https://thesmartworth.site",
      ownerName: "Sahil Aureon",
      ownerEmail: "helplinesmartworth@gmail.com"
    };

    const pdfBytes = generateEdgeReceiptPdfBytes(receiptData);
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);
    const pdfFilename = `TheSmartWorth-Receipt-${invoiceNumber.replace("#", "")}.pdf`;

    const html = getOrderEmail({
      status,
      order_number: invoiceNumber.replace("#", ""),
      order_id: orderId,
      payment_id: paymentId,
      customer_name: customerName,
      username,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      billing_address: billingAddress,
      product_name: packageName,
      quantity: 1,
      original_price: originalPrice,
      discount_amount: discountAmount,
      price: originalPrice,
      subtotal: finalAmount,
      total: finalAmount,
      payment_method: receiptData.paymentMethod,
      referral_code: referralCode,
      created_at: new Date().toISOString()
    });

    const subject =
      status === "successful"
        ? `Official Payment Receipt ${invoiceNumber} - The Smart Worth (${packageName})`
        : `Order ${invoiceNumber} Unsuccessful - The Smart Worth`;

    const ownerEmail = Deno.env.get("OWNER_EMAIL") || "helplinesmartworth@gmail.com";
    const recipients = Array.from(new Set([customerEmail, ownerEmail].filter(Boolean)));
    const deliveryChannels: string[] = [];

    // 1. Send via Resend API with PDF Attachment if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      for (const recipient of recipients) {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: Deno.env.get("SMTP_FROM") || "The Smart Worth <orders@thesmartworth.site>",
            to: [recipient],
            subject,
            html,
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBase64
              }
            ]
          })
        });
        if (resendRes.ok) {
          deliveryChannels.push(`resend:${recipient}`);
        }
      }
    }

    // 2. Send via SMTP if SMTP_HOST / SMTP_USER / SMTP_PASS are configured
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "helplinesmartworth@gmail.com";

    if (smtpHost && smtpUser && smtpPass) {
      const client = new SmtpClient();
      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPass
      });

      for (const recipient of recipients) {
        await client.send({
          from: smtpFrom,
          to: recipient,
          subject,
          content: `Official Payment Receipt ${invoiceNumber} from The Smart Worth`,
          html
        });
        deliveryChannels.push(`smtp:${recipient}`);
      }
      await client.close();
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber,
        order_id: orderId,
        payment_id: paymentId,
        recipient: customerEmail,
        pdf_filename: pdfFilename,
        pdf_base64: pdfBase64,
        channels: deliveryChannels
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send payment receipt" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
