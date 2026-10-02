-- ============================================================================
-- THE SMART WORTH - COMPLETE PAYMENT RECEIPT & EDGE FUNCTION AUTOMATION SQL
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Enable pg_net extension so PostgreSQL can directly trigger Edge Functions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Add complete customer, package, offer & receipt columns to razorpay_orders
ALTER TABLE public.razorpay_orders
  ADD COLUMN IF NOT EXISTS package_name TEXT DEFAULT 'VIP Learning Package',
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS pin_code TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI QR Code (The Smart Worth Pay)',
  ADD COLUMN IF NOT EXISTS receipt_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create payment_invoices table to permanently store every Official Receipt
CREATE TABLE IF NOT EXISTS public.payment_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'paid',
  package_id TEXT,
  package_name TEXT NOT NULL,
  original_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT DEFAULT 'UPI QR Code (The Smart Worth Pay)',
  customer_name TEXT,
  username TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  billing_address TEXT,
  referral_code TEXT,
  website_name TEXT DEFAULT 'The Smart Worth',
  website_url TEXT DEFAULT 'https://thesmartworth.site',
  owner_name TEXT DEFAULT 'Sahil Aureon',
  owner_email TEXT DEFAULT 'helplinesmartworth@gmail.com',
  email_sent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payment_invoices
ALTER TABLE public.payment_invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_invoices' AND policyname = 'Users can view own payment invoices'
  ) THEN
    CREATE POLICY "Users can view own payment invoices"
      ON public.payment_invoices
      FOR SELECT
      USING (auth.uid() = user_id OR customer_email = (auth.jwt() ->> 'email'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_invoices' AND policyname = 'Service role full access on payment_invoices'
  ) THEN
    CREATE POLICY "Service role full access on payment_invoices"
      ON public.payment_invoices
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.payment_invoices TO anon, authenticated, service_role;

-- 4. Create Trigger Function that automatically logs the invoice & calls the
--    Supabase Edge Function (send-payment-receipt) when an order becomes 'paid'
CREATE OR REPLACE FUNCTION public.handle_paid_order_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_no TEXT;
  v_short_digits TEXT;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Only run when status transitions to 'paid'
  IF (NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid')) THEN
    v_short_digits := RIGHT(REGEXP_REPLACE(COALESCE(NEW.razorpay_order_id, ''), '[^0-9]', '', 'g'), 5);
    IF v_short_digits IS NULL OR LENGTH(v_short_digits) < 3 THEN
      v_short_digits := RIGHT((EXTRACT(EPOCH FROM NOW())::BIGINT)::TEXT, 5);
    END IF;

    v_invoice_no := COALESCE(NEW.invoice_number, '#TSW-' || v_short_digits);
    NEW.invoice_number := v_invoice_no;
    NEW.receipt_sent := TRUE;
    NEW.receipt_sent_at := NOW();

    -- Save or update Official Invoice in payment_invoices table
    INSERT INTO public.payment_invoices (
      invoice_number,
      order_id,
      payment_id,
      user_id,
      status,
      package_id,
      package_name,
      original_price,
      discount_amount,
      final_amount,
      payment_method,
      customer_name,
      username,
      customer_email,
      customer_phone,
      billing_address,
      referral_code
    )
    VALUES (
      v_invoice_no,
      NEW.razorpay_order_id,
      NEW.razorpay_payment_id,
      NEW.user_id,
      'paid',
      NEW.package_id,
      COALESCE(NEW.package_name, 'VIP Learning Package'),
      GREATEST(COALESCE(NEW.original_price, NEW.amount), NEW.amount),
      COALESCE(NEW.discount_amount, 0),
      NEW.amount,
      COALESCE(NEW.payment_method, 'UPI QR Code (The Smart Worth Pay)'),
      COALESCE(NEW.customer_name, 'Valued Student'),
      COALESCE(NEW.username, SPLIT_PART(COALESCE(NEW.email, 'student@thesmartworth.site'), '@', 1)),
      COALESCE(NEW.email, 'guest@thesmartworth.site'),
      COALESCE(NEW.mobile, ''),
      CONCAT_WS(', ', NULLIF(NEW.city, ''), NULLIF(NEW.state, ''), NULLIF(NEW.pin_code, '')),
      NEW.referral_code
    )
    ON CONFLICT (order_id) DO UPDATE SET
      payment_id = EXCLUDED.payment_id,
      status = 'paid',
      email_sent = TRUE;

    -- Optional: If supabase_url is stored in vault/settings, auto-call Edge Function via pg_net
    BEGIN
      v_supabase_url := current_setting('app.settings.supabase_url', true);
      v_service_key := current_setting('app.settings.service_role_key', true);

      IF v_supabase_url IS NOT NULL AND v_supabase_url <> '' THEN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/send-payment-receipt',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
          ),
          body := jsonb_build_object(
            'order_id', NEW.razorpay_order_id,
            'payment_id', NEW.razorpay_payment_id,
            'invoice_number', v_invoice_no,
            'status', 'successful',
            'customer_email', NEW.email,
            'customer_name', COALESCE(NEW.customer_name, 'Valued Student'),
            'username', COALESCE(NEW.username, ''),
            'customer_phone', COALESCE(NEW.mobile, ''),
            'city', COALESCE(NEW.city, ''),
            'state', COALESCE(NEW.state, ''),
            'pin_code', COALESCE(NEW.pin_code, ''),
            'package_name', COALESCE(NEW.package_name, 'VIP Learning Package'),
            'original_price', GREATEST(COALESCE(NEW.original_price, NEW.amount), NEW.amount),
            'discount_amount', COALESCE(NEW.discount_amount, 0),
            'amount', NEW.amount,
            'payment_method', 'UPI QR Code (The Smart Worth Pay)',
            'referral_code', COALESCE(NEW.referral_code, '')
          )
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Non-blocking so payment status update never fails
      RAISE NOTICE 'Edge function pg_net trigger skipped: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_razorpay_order_paid_receipt ON public.razorpay_orders;
CREATE TRIGGER on_razorpay_order_paid_receipt
  BEFORE UPDATE ON public.razorpay_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_paid_order_receipt();
