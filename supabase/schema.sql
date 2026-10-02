-- SQL Schema for THE SMART WORTH Email Notification System

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Adjust as needed for your app)
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- 3. Database Webhook Triggers (Requires pg_net extension)
-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call the Edge Function for Orders
CREATE OR REPLACE FUNCTION public.handle_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'type', 'order',
        'data', row_to_json(NEW)
    );

    PERFORM net.http_post(
        url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
        ),
        body := payload
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Orders
CREATE TRIGGER on_order_created
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_order_notification();

-- Trigger for Order Status Changes
CREATE TRIGGER on_order_updated
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_order_notification();

-- Function to call the Edge Function for Withdrawals
CREATE OR REPLACE FUNCTION public.handle_withdrawal_notification()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'type', 'withdrawal',
        'data', row_to_json(NEW)
    );

    PERFORM net.http_post(
        url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
        ),
        body := payload
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Withdrawals
CREATE TRIGGER on_withdrawal_created
AFTER INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.handle_withdrawal_notification();

-- Trigger for Withdrawal Status Changes
CREATE TRIGGER on_withdrawal_updated
AFTER UPDATE OF status ON public.withdrawals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_withdrawal_notification();
