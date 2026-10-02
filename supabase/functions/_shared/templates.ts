/**
 * THE SMART WORTH - Email Templates
 * WooCommerce-style design
 */

export const BASE_STYLE = `
  body {
    margin: 0;
    padding: 0;
    font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
    background-color: #f7f7f7;
    color: #636363;
  }
  .wrapper {
    width: 100%;
    table-layout: fixed;
    background-color: #f7f7f7;
    padding-bottom: 40px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important;
    border: 1px solid #dcdcdc;
    border-radius: 3px !important;
  }
  .header {
    background-color: #5e5ce6;
    border-radius: 3px 3px 0 0 !important;
    color: #ffffff;
    padding: 36px 48px;
    display: block;
    font-family: "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
    font-size: 30px;
    font-weight: 300;
    line-height: 150%;
    margin: 0;
    text-align: left;
    text-shadow: 0 1px 0 #7c7c7c;
  }
  .content {
    padding: 48px;
  }
  .h1 {
    color: #5e5ce6;
    display: block;
    font-family: "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
    font-size: 30px;
    font-weight: 300;
    line-height: 150%;
    margin: 0 0 16px;
    text-align: left;
  }
  .text {
    color: #636363;
    font-family: "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 150%;
    margin: 0 0 16px;
    text-align: left;
  }
  .order-table {
    width: 100%;
    border: 1px solid #e5e5e5;
    margin-bottom: 40px;
    border-collapse: collapse;
  }
  .order-table th {
    color: #636363;
    border: 1px solid #e5e5e5;
    padding: 12px;
    text-align: left;
  }
  .order-table td {
    color: #636363;
    border: 1px solid #e5e5e5;
    padding: 12px;
    text-align: left;
    vertical-align: middle;
  }
  .product-img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    margin-right: 10px;
    border-radius: 4px;
  }
  .address-section {
    margin-bottom: 40px;
  }
  .address-title {
    color: #5e5ce6;
    font-family: "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 130%;
    margin: 0 0 16px;
    text-align: left;
  }
  .footer {
    padding: 24px 48px;
    text-align: center;
    font-size: 12px;
    color: #999999;
  }
  .button {
    background-color: #5e5ce6;
    border-radius: 3px;
    color: #ffffff !important;
    display: inline-block;
    font-size: 16px;
    font-weight: bold;
    line-height: 100%;
    padding: 15px 25px;
    text-decoration: none;
    text-transform: none;
    margin: 20px 0;
  }
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .status-success { background-color: #e6f4ea; color: #1e8e3e; }
  .status-failed { background-color: #fce8e6; color: #d93025; }
  .status-pending { background-color: #fef7e0; color: #f9ab00; }
`;

export const getOrderEmail = (data: any) => {
  const isSuccess = data.status === 'successful' || data.status === 'paid';
  const statusColor = isSuccess ? '#15803d' : '#b91c1c';
  const statusBadge = isSuccess ? 'PAID & VERIFIED' : 'UNSUCCESSFUL';
  const title = isSuccess ? 'Thank You! Your Order is Complete' : 'Order Payment Unsuccessful';
  const originalPrice = Number(data.original_price ?? data.price ?? data.total ?? 0);
  const totalAmount = Number(data.total ?? data.subtotal ?? data.price ?? 0);
  const discountAmount = Number(data.discount_amount ?? Math.max(0, originalPrice - totalAmount));
  const dateFormatted = new Date(data.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const message = isSuccess
    ? `Dear ${data.customer_name || 'Valued Student'}, your payment at <strong>The Smart Worth</strong> has been verified automatically and your package is now active. Your official PDF receipt is attached to this email.`
    : `Dear ${data.customer_name || 'Valued Student'}, unfortunately we could not complete your order #${data.order_number} due to a payment issue. Please return to The Smart Worth to complete your purchase.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Official Receipt #${data.order_number} - The Smart Worth</title>
</head>
<body style="margin:0;padding:12px;background-color:#eef2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #cbd5e1;border-top:6px solid #d97706;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
    <!-- Classic Executive Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#312e81 100%);padding:28px 24px;color:#ffffff;border-bottom:3px solid #d97706;">
      <div style="display:inline-block;background:rgba(245,158,11,0.2);border:1px solid rgba(251,191,36,0.5);color:#fde68a;padding:5px 12px;border-radius:8px;font-weight:800;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;">
        SW • THE SMART WORTH
      </div>
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#ffffff;">
        The Smart Worth
      </h1>
      <p style="margin:6px 0 12px;font-size:13px;color:#cbd5e1;">
        Official Payment Receipt &amp; Tax Invoice • thesmartworth.site
      </p>
      <div>
        <span style="display:inline-block;background:${statusColor};color:#ffffff;font-size:11px;font-weight:800;padding:6px 14px;border-radius:999px;letter-spacing:1px;text-transform:uppercase;">
          ${statusBadge}
        </span>
        <span style="margin-left:10px;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fde68a;">
          Invoice #${data.order_number}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 20px;">
      <div style="background:#f8fafc;border-left:4px solid #312e81;border-radius:0 10px 10px 0;padding:16px;margin-bottom:22px;">
        <h2 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#0f172a;">
          ${title}
        </h2>
        <p style="margin:0;font-size:14.5px;line-height:1.6;color:#334155;">
          ${message}
        </p>
      </div>

      <!-- Order Metadata -->
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px 16px;margin-bottom:22px;font-size:14px;line-height:1.7;">
        <div><strong>Invoice No:</strong> #${data.order_number} &nbsp;|&nbsp; <strong>Date:</strong> ${dateFormatted}</div>
        ${data.order_id ? `<div><strong>Order ID:</strong> ${data.order_id}</div>` : ''}
        ${data.payment_id ? `<div><strong>Transaction ID:</strong> ${data.payment_id}</div>` : ''}
      </div>

      <!-- Package & Price Table -->
      <h3 style="margin:0 0 10px;font-family:Georgia,serif;font-size:18px;color:#0f172a;border-bottom:2px solid #0f172a;padding-bottom:6px;">
        Order &amp; Package Summary
      </h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:20px;font-size:14.5px;">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;text-align:left;font-size:12px;text-transform:uppercase;">
            <th style="padding:12px;">Package</th>
            <th style="padding:12px;text-align:center;">Qty</th>
            <th style="padding:12px;text-align:right;">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:14px 12px;">
              <strong style="font-family:Georgia,serif;font-size:16px;color:#0f172a;">${data.product_name || data.package_name || 'VIP Learning Package'}</strong>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">Digital Learning Package • Instant Lifetime Access</div>
            </td>
            <td style="padding:14px 12px;text-align:center;font-weight:700;">×${data.quantity || 1}</td>
            <td style="padding:14px 12px;text-align:right;font-weight:700;">₹${originalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:10px 12px;color:#475569;">Original Package Price (MRP):</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;">₹${originalPrice.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:10px 12px;color:#15803d;font-weight:700;">Special Offer / Referral Discount ${data.referral_code ? `(${data.referral_code})` : ''}:</td>
            <td style="padding:10px 12px;text-align:right;color:#15803d;font-weight:800;">- ₹${discountAmount.toFixed(2)}</td>
          </tr>
          <tr style="border-top:2px solid #0f172a;border-bottom:2px solid #0f172a;background:#f8fafc;">
            <td colspan="2" style="padding:14px 12px;font-family:Georgia,serif;font-size:17px;font-weight:700;color:#0f172a;">Total Amount Paid:</td>
            <td style="padding:14px 12px;text-align:right;font-size:19px;font-weight:900;color:#312e81;">₹${totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:10px 12px;color:#475569;">Payment Method:</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;">${data.payment_method || 'UPI QR Code (The Smart Worth Pay)'}</td>
          </tr>
        </tbody>
      </table>

      <!-- Customer &Billing Card -->
      <div style="border:1.5px solid #cbd5e1;border-radius:12px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#0f172a;color:#fde68a;padding:11px 16px;font-family:Georgia,serif;font-size:14px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #d97706;">
          Customer &amp; Billing Details
        </div>
        <div style="padding:14px 16px;font-size:14.5px;line-height:1.75;color:#0f172a;">
          <div><strong>Customer Name:</strong> ${data.customer_name || 'Valued Student'}</div>
          ${data.username ? `<div><strong>Username:</strong> @${data.username}</div>` : ''}
          <div><strong>Registered Email:</strong> ${data.customer_email}</div>
          ${data.customer_phone ? `<div><strong>Mobile Number:</strong> +91 ${data.customer_phone}</div>` : ''}
          ${data.billing_address ? `<div><strong>Billing Address:</strong> ${data.billing_address}</div>` : ''}
        </div>
      </div>

      <!-- Website & Owner Card -->
      <div style="border:1.5px solid #cbd5e1;border-radius:12px;overflow:hidden;margin-bottom:20px;">
        <div style="background:#0f172a;color:#fde68a;padding:11px 16px;font-family:Georgia,serif;font-size:14px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #d97706;">
          Website &amp; Owner Details
        </div>
        <div style="padding:14px 16px;font-size:14.5px;line-height:1.75;color:#0f172a;">
          <div><strong>Official Website:</strong> The Smart Worth (<a href="https://thesmartworth.site" style="color:#312e81;font-weight:700;text-decoration:none;">https://thesmartworth.site</a>)</div>
          <div><strong>Founder &amp; Owner:</strong> Sahil Aureon</div>
          <div><strong>Support Email:</strong> <a href="mailto:helplinesmartworth@gmail.com" style="color:#312e81;font-weight:700;text-decoration:none;">helplinesmartworth@gmail.com</a></div>
          <div style="color:#15803d;font-weight:700;"><strong>Gateway:</strong> The Smart Worth Pay (Verified)</div>
        </div>
      </div>

      <p style="margin:18px 0 0;font-size:13.5px;color:#475569;text-align:center;">
        Need help with your order? Contact us anytime at
        <a href="mailto:helplinesmartworth@gmail.com" style="color:#312e81;font-weight:800;text-decoration:none;">helplinesmartworth@gmail.com</a>
      </p>
    </div>

    <div style="background:#0f172a;color:#cbd5e1;padding:18px 20px;text-align:center;font-size:12.5px;border-top:3px solid #d97706;">
      <strong>The Smart Worth</strong> • Owned &amp; Operated by <strong>Sahil Aureon</strong> • Powered by The Smart Worth Pay
    </div>
  </div>
</body>
</html>`;
};

export const getWithdrawalEmail = (data: any) => {
  let title = '';
  let message = '';
  let headerColor = '#5e5ce6';

  if (data.status === 'pending') {
    title = 'Withdrawal Request Received';
    message = `Hi ${data.customer_name},<br><br>Your withdrawal request for ₹${data.amount} has been submitted and is currently pending approval.`;
  } else if (data.status === 'approved') {
    title = 'Withdrawal Approved';
    message = `Hi ${data.customer_name},<br><br>Great news! Your withdrawal request for ₹${data.amount} has been approved and processed.`;
    headerColor = '#1e8e3e';
  } else {
    title = 'Withdrawal Rejected';
    message = `Hi ${data.customer_name},<br><br>Your withdrawal request for ₹${data.amount} was rejected.<br>Reason: ${data.rejection_reason || 'N/A'}`;
    headerColor = '#d93025';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${BASE_STYLE}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header" style="background-color: ${headerColor}">THE SMART WORTH</div>
          <div class="content">
            <h1 class="h1" style="color: ${headerColor}">${title}</h1>
            <p class="text">${message}</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p class="text"><strong>Amount:</strong> ₹${data.amount}</p>
              <p class="text"><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status}</span></p>
              <p class="text"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p class="text" style="text-align: center;">
              If you have any questions, please contact us at<br>
              <a href="mailto:helplinesmartworth@gmail.com" style="color: #5e5ce6;">helplinesmartworth@gmail.com</a>
            </p>
          </div>
          <div class="footer">
            THE SMART WORTH — Built with Supabase
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getAuthEmail = (type: string, data: any) => {
  let title = '';
  let message = '';
  let buttonText = '';
  let buttonUrl = '';

  switch (type) {
    case 'welcome':
      title = 'Welcome to THE SMART WORTH';
      message = `Hi ${data.name},<br><br>Welcome to THE SMART WORTH! We're excited to have you on board. Start exploring our premium courses today.`;
      buttonText = 'Explore Courses';
      buttonUrl = 'https://thesmartworth.com/courses';
      break;
    case 'login':
      title = 'Welcome Back!';
      message = `Hi ${data.name},<br><br>We noticed a new login to your account. If this was you, you can safely ignore this email.`;
      break;
    case 'reset_password':
      title = 'Password Reset Request';
      message = `Hi ${data.name},<br><br>Someone requested a password reset for your account. If this was you, click the button below to set a new password:`;
      buttonText = 'Reset Password';
      buttonUrl = data.reset_url;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>${BASE_STYLE}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">THE SMART WORTH</div>
          <div class="content">
            <h1 class="h1">${title}</h1>
            <p class="text">${message}</p>
            
            ${buttonText ? `<div style="text-align: center;"><a href="${buttonUrl}" class="button">${buttonText}</a></div>` : ''}

            <p class="text" style="text-align: center; margin-top: 40px;">
              Need help? Contact us at<br>
              <a href="mailto:helplinesmartworth@gmail.com" style="color: #5e5ce6;">helplinesmartworth@gmail.com</a>
            </p>
          </div>
          <div class="footer">
            THE SMART WORTH — Built with Supabase
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
