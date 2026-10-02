# THE SMART WORTH - Advanced Email Notification System Guide

This guide explains how to set up and use the automated email notification system built exclusively with Supabase.

## 1. Database Setup
Run the SQL in `/supabase/schema.sql` in your Supabase SQL Editor. This will:
- Create `orders` and `withdrawals` tables.
- Enable Row Level Security (RLS).
- Enable the `pg_net` extension.
- Create triggers to automatically call the Edge Function when data changes.

**IMPORTANT:** In the SQL, replace `<YOUR_PROJECT_REF>` and `<YOUR_SERVICE_ROLE_KEY>` with your actual project details.

## 2. SMTP Configuration
You must set up your SMTP credentials in Supabase Edge Function Secrets. Run these commands in your terminal (using Supabase CLI) or set them in the Supabase Dashboard (Settings > Edge Functions):

```bash
supabase secrets set SMTP_HOST=your-smtp-host.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-email@domain.com
supabase secrets set SMTP_PASS=your-smtp-password
supabase secrets set SMTP_FROM=helplinesmartworth@gmail.com
```

## 3. Edge Function Deployment
Deploy the `send-notification` function:

```bash
supabase functions deploy send-notification
```

## 4. Frontend Integration Example (React/JS)

### Triggering an Order Email
When a user completes a purchase, simply insert a record into the `orders` table. The trigger will handle the rest.

```javascript
const { data, error } = await supabase
  .from('orders')
  .insert([
    {
      order_number: 'SW-' + Date.now(),
      customer_name: 'Sahil',
      customer_email: 'sahil@example.com',
      product_name: 'Advanced Trading Course',
      product_image: 'https://your-site.com/course-img.jpg',
      quantity: 1,
      price: 2999.00,
      subtotal: 2999.00,
      total: 2999.00,
      payment_method: 'Credit Card',
      status: 'successful' // This triggers the "Order Successful" email
    }
  ]);
```

### Triggering an Auth Email (Welcome/Login)
You can call the Edge Function directly for auth-related events that aren't tied to database triggers.

```javascript
const sendWelcomeEmail = async (user) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      type: 'auth',
      emailType: 'welcome',
      data: {
        name: user.full_name,
        email: user.email
      }
    }
  });
};
```

## 5. Automated Triggers
- **New Order:** Sends "Order Successful" or "Order Failed" based on status.
- **Status Update:** If you change an order status from `pending` to `successful` in the dashboard, the email is sent automatically.
- **Withdrawal:** Sends "Request Received" on insert, and "Approved/Rejected" on status update.

## 6. Email Design
The templates in `supabase/functions/_shared/templates.ts` are designed to match the WooCommerce style exactly:
- Clean white card with soft shadow.
- Professional typography.
- Mobile responsive layout.
- Dynamic color coding (Green for success, Red for failure).
