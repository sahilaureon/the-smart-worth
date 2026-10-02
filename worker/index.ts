import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from '@supabase/supabase-js';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
}

type Variables = {
  user: any;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. MIDDLEWARE
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://thesmartworth.site',
      'https://www.thesmartworth.site',
      'https://thesmartworth.com',
      'https://thesmartworth.pages.dev'
    ];
    if (!origin) return allowedOrigins[0];
    if (
      allowedOrigins.includes(origin) || 
      origin.endsWith('.thesmartworth.site') || 
      origin.includes('localhost') || 
      origin.includes('ais-') ||
      origin.includes('run.app')
    ) return origin;
    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tsw-key'],
  credentials: true,
  maxAge: 86400,
}));

// 2. HELPERS
const getSupabase = (env: Bindings) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

const verifyAuth = async (c: any) => {
  // Support both x-tsw-key header AND Bearer token authentication
  const tswKey = c.req.header('x-tsw-key');
  if (tswKey && tswKey === c.env.JWT_SECRET) {
    return { id: 'system', role: 'admin', email: 'helplinesmartworth@gmail.com' };
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return null;
  
  try {
    const supabase = getSupabase(c.env);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Fetch profile for role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return { ...user, role: profile?.role || 'user' };
  } catch (e) {
    return null;
  }
};

const verifyAdmin = async (c: any, user: any) => {
  const adminEmails = ['helplinesmartworth@gmail.com'];
  return user && (user.role === 'admin' || user.role === 'owner' || adminEmails.includes(user.email));
};

const verifyRazorpaySignature = async (orderId: string, paymentId: string, signature: string, secret: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hmac = await crypto.subtle.sign('HMAC', key, data);
  const digest = Array.from(new Uint8Array(hmac))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return digest === signature;
};

const formatImageUrl = (url: string | null | undefined, cloudName?: string) => {
  if (!url) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (cloudName) {
    if (!url.includes('/') && !url.startsWith('https://')) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/${url}`;
    }
    if (url.startsWith('image/upload/')) {
      return `https://res.cloudinary.com/${cloudName}/${url}`;
    }
  }
  return url;
};

const mapPackageImages = (pkg: any, cloudName?: string) => {
  if (!pkg) return pkg;
  const rawUrl = pkg.thumbnail_url || pkg.thumbnail || pkg.cover_image || pkg.image;
  const formattedUrl = formatImageUrl(rawUrl, cloudName);
  return {
    ...pkg,
    thumbnail_url: formattedUrl,
    thumbnail: formattedUrl,
    image: formattedUrl,
    cover_image: formattedUrl,
  };
};

const mapCourseImages = (course: any, cloudName?: string) => {
  if (!course) return course;
  const rawUrl = course.thumbnail_url || course.thumbnail || course.cover_image || course.image;
  const formattedUrl = formatImageUrl(rawUrl, cloudName);
  return {
    ...course,
    thumbnail_url: formattedUrl,
    thumbnail: formattedUrl,
    image: formattedUrl,
    cover_image: formattedUrl,
  };
};

// Sub-app for all API endpoints to make them prefix-independent
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Security middleware for protected routes
api.use('*', async (c, next) => {
  const path = c.req.path;
  
  // Normalize path
  const normPath = path.startsWith('/api') ? path.substring(4) : path;
  
  const isProtected = 
    normPath === '/users' || normPath.startsWith('/users/') ||
    normPath === '/admin' || normPath.startsWith('/admin/') ||
    normPath === '/dashboard' || normPath.startsWith('/dashboard/') ||
    normPath === '/withdraw' || normPath.startsWith('/withdraw/') ||
    normPath === '/profile' || normPath.startsWith('/profile/') ||
    normPath === '/kyc' || normPath.startsWith('/kyc/') ||
    normPath === '/payouts' || normPath.startsWith('/payouts/') ||
    normPath === '/admin-action' || normPath.startsWith('/admin-action/') ||
    normPath === '/ai/chat' || normPath.startsWith('/ai/chat/');

  if (isProtected) {
    const user = await verifyAuth(c);
    if (!user) {
      return c.json({
        success: false,
        message: "Unauthorized Access"
      }, 401);
    }
    c.set('user', user);
  }
  
  await next();
});

// --- PUBLIC DATA ENDPOINTS ---
api.get('/packages', async (c) => {
  const supabase = getSupabase(c.env);
  const { data } = await supabase.from('packages').select('*');
  return c.json((data || []).map(p => mapPackageImages(p, c.env.CLOUDINARY_CLOUD_NAME)));
});

api.get('/packages/:id', async (c) => {
  const supabase = getSupabase(c.env);
  const { data, error } = await supabase.from('packages').select('*').eq('id', c.req.param('id')).single();
  if (error || !data) return c.json({ error: 'Package not found' }, 404);
  return c.json(mapPackageImages(data, c.env.CLOUDINARY_CLOUD_NAME));
});

api.get('/courses', async (c) => {
  const supabase = getSupabase(c.env);
  const { data } = await supabase.from('courses').select('*');
  return c.json((data || []).map(co => mapCourseImages(co, c.env.CLOUDINARY_CLOUD_NAME)));
});

// --- AUTH ROUTING ---
api.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabase = getSupabase(c.env);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: error.message }, 401);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    return c.json({ user: data.user, session: data.session, profile });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/signup', async (c) => {
  try {
    const { email, password, full_name, mobile, referral_code, package_id } = await c.req.json();
    const supabase = getSupabase(c.env);
    
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name, mobile }
    });
    if (authError) return c.json({ error: authError.message }, 400);

    // 2. Create Profile
    const tswId = `TSW${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const referralCode = `REF${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      email,
      mobile,
      phone: mobile,
      package_id,
      tsw_id: tswId,
      referral_code: referralCode,
      referred_by: referral_code || null,
      wallet_balance: 0,
      total_earned: 0,
      role: 'user'
    });

    // 3. Return session
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return c.json({ user: data.user, session: data.session });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

const sendOtpHandler = async (c: any) => {
  try {
    const { email } = await c.req.json();
    console.log('[Worker] OTP request for:', email);
    const { error } = await getSupabase(c.env).auth.signInWithOtp({ email });
    if (error) {
      return c.json({
        success: false,
        message: error.message,
        error: error.message
      }, 400);
    }
    return c.json({
      success: true,
      message: "OTP sent successfully",
      data: { success: true }
    });
  } catch (e: any) {
    return c.json({
      success: false,
      message: e.message,
      error: e.message
    }, 500);
  }
};
api.post('/send-otp', sendOtpHandler);
api.post('/forgot-password', sendOtpHandler);

const verifyOtpHandler = async (c: any) => {
  try {
    const { email, token } = await c.req.json();
    console.log('[Worker] Verify OTP for:', email);
    const { data, error } = await getSupabase(c.env).auth.verifyOtp({ email, token, type: 'email' });
    if (error) {
      return c.json({
        success: false,
        message: error.message,
        error: error.message
      }, 400);
    }
    return c.json({
      success: true,
      data: { session: data.session },
      session: data.session
    });
  } catch (e: any) {
    return c.json({
      success: false,
      message: e.message,
      error: e.message
    }, 500);
  }
};
api.post('/verify-otp', verifyOtpHandler);
api.post('/reset-password', verifyOtpHandler);

api.post('/update-user', async (c) => {
  try {
    const user = c.get('user') || await verifyAuth(c);
    if (!user) return c.json({ success: false, message: 'Unauthorized', error: 'Unauthorized' }, 401);
    const { password } = await c.req.json();
    const { error } = await getSupabase(c.env).auth.admin.updateUserById(user.id, { password });
    if (error) {
      return c.json({
        success: false,
        message: error.message,
        error: error.message
      }, 400);
    }
    return c.json({
      success: true,
      message: "Password updated successfully",
      data: { success: true }
    });
  } catch (e: any) {
    return c.json({
      success: false,
      message: e.message,
      error: e.message
    }, 500);
  }
});

// --- PAYMENTS & WEBHOOKS ---
api.post('/razorpay-webhook', async (c) => {
  const env = c.env;
  const signature = c.req.header('x-razorpay-signature');
  const body = await c.req.text();
  
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Verification
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.RAZORPAY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hmac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const digest = Array.from(new Uint8Array(hmac)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (digest !== signature) {
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  const payload = JSON.parse(body);
  const supabase = getSupabase(env);

  if (payload.event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const orderId = payment.order_id;
    
    // Update order status
    const { data: order } = await supabase.from('razorpay_orders').update({ 
      status: 'paid',
      razorpay_payment_id: payment.id 
    }).eq('razorpay_order_id', orderId).select().single();

    if (order) {
      // Grant Access
      await Promise.all([
        supabase.from('profiles').update({ package_id: order.package_id }).eq('id', order.user_id || order.user_email),
        supabase.from('enrollments').upsert({ user_id: order.user_id, package_id: order.package_id, status: 'active' })
      ]);
    }
    
    // Also log to razorpay_payments
    await supabase.from('razorpay_payments').insert({
      payment_id: payment.id,
      order_id: orderId,
      amount: payment.amount / 100,
      email: payment.email,
      contact: payment.contact,
      method: payment.method,
      status: payment.status,
      created_at: new Date()
    });
  }

  return c.json({ success: true });
});

const createOrderHandler = async (c: any) => {
  const user = c.get('user') || await verifyAuth(c);
  
  try {
    const { packageId, package_id, amount, email } = await c.req.json();
    const pkgId = packageId || package_id;
    const env = c.env;
    const supabase = getSupabase(env);

    let finalAmount = amount;
    if (!finalAmount) {
      const { data: pkg } = await supabase.from('packages').select('price').eq('id', pkgId).single();
      if (!pkg) return c.json({ error: 'Package not found' }, 404);
      finalAmount = pkg.price;
    }
    
    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: Math.round(Number(finalAmount) * 100), 
        currency: 'INR', 
        receipt: `order_${user?.id || 'guest'}_${Date.now()}` 
      })
    });
    
    const order = await rzpRes.json();
    if (!rzpRes.ok) return c.json(order, rzpRes.status as any);

    await supabase.from('razorpay_orders').insert({
      user_id: user?.id || null,
      user_email: email || user?.email || null,
      package_id: pkgId,
      razorpay_order_id: order.id,
      amount: Number(finalAmount),
      status: 'created'
    });

    return c.json({ ...order, key_id: env.RAZORPAY_KEY_ID });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};

api.post('/payment/create-order', createOrderHandler);
api.post('/payments/create-order', createOrderHandler);
api.post('/bright-function', createOrderHandler);

api.post('/payment/initiate-upi', async (c: any) => {
  try {
    const { order_id, amount, email, contact, flow = 'intent', vpa } = await c.req.json();
    const keyId = c.env.RAZORPAY_KEY_ID || '';
    const amountInPaise = Math.max(100, Math.round(Number(amount || 599) * 100));
    const cleanEmail = String(email || 'customer@thesmartworth.site').trim();
    const cleanContact = String(contact || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

    const params: Record<string, string> = {
      key_id: keyId,
      amount: String(amountInPaise),
      currency: 'INR',
      order_id: String(order_id),
      email: cleanEmail,
      contact: cleanContact,
      method: 'upi',
      '_[flow]': flow === 'collect' ? 'collect' : 'intent'
    };

    if (flow === 'collect') {
      const cleanVpa = String(vpa || '').trim().toLowerCase();
      if (!cleanVpa || !cleanVpa.includes('@')) {
        return c.json({ error: 'Please enter a valid UPI ID (e.g. mobile@ybl or name@okaxis)' }, 400);
      }
      params.vpa = cleanVpa;
    }

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/create/ajax?key_id=${encodeURIComponent(keyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString()
    });

    const rzpData: any = await rzpRes.json().catch(() => ({}));
    if (!rzpRes.ok || rzpData?.error) {
      return c.json({ error: rzpData?.error?.description || 'Failed to initiate UPI request with Razorpay.' }, 400);
    }

    const paymentId = rzpData.payment_id || '';
    const intentUrl = rzpData?.data?.intent_url || '';
    const qrImageUrl = intentUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(intentUrl)}`
      : '';

    return c.json({
      success: true,
      order_id,
      payment_id: paymentId,
      flow: flow === 'collect' ? 'collect' : 'intent',
      intent_url: intentUrl,
      qr_image_url: qrImageUrl,
      vpa: vpa || null
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.post('/payment/validate-vpa', async (c: any) => {
  try {
    const body = await c.req.json();
    const vpa = String(body?.vpa || '').trim().toLowerCase();
    if (!vpa || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) {
      return c.json({ valid: false, error: 'Invalid UPI ID format' }, 400);
    }
    const handleName = vpa.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase());
    return c.json({ valid: true, vpa, customer_name: handleName || 'UPI ID Valid' });
  } catch (e: any) {
    return c.json({ valid: false, error: e.message }, 500);
  }
});

api.post('/payment/create-qr', async (c: any) => {
  try {
    const { order_id, amount, email, contact } = await c.req.json();
    const keyId = c.env.RAZORPAY_KEY_ID || '';
    const amountInPaise = Math.max(100, Math.round(Number(amount || 599) * 100));
    const params = new URLSearchParams({
      key_id: keyId,
      amount: String(amountInPaise),
      currency: 'INR',
      order_id: String(order_id),
      email: String(email || 'customer@thesmartworth.site').trim(),
      contact: String(contact || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210',
      method: 'upi',
      '_[flow]': 'intent'
    });

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/create/ajax?key_id=${encodeURIComponent(keyId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const rzpData: any = await rzpRes.json().catch(() => ({}));
    if (rzpRes.ok && rzpData?.data?.intent_url) {
      const intentUrl = rzpData.data.intent_url;
      return c.json({
        qr_id: rzpData.payment_id,
        payment_id: rzpData.payment_id,
        image_url: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(intentUrl)}`,
        upi_url: intentUrl,
        order_id
      });
    }
    return c.json({ error: 'Could not generate live Razorpay QR code' }, 400);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

api.get('/payment/status/:orderId', async (c: any) => {
  const orderId = c.req.param('orderId');
  const paymentId = c.req.query('payment_id') || '';
  const auth = btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`);
  try {
    if (paymentId && paymentId.startsWith('pay_')) {
      const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      if (payRes.ok) {
        const payment: any = await payRes.json();
        if (payment.status === 'captured' || payment.status === 'authorized') {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey('raw', encoder.encode(c.env.RAZORPAY_KEY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
          const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${payment.id}`));
          const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
          return c.json({
            status: 'paid',
            razorpay_order_id: orderId,
            razorpay_payment_id: payment.id,
            razorpay_signature: signature,
            method: payment.method || 'upi'
          });
        }
        if (payment.status === 'failed') {
          return c.json({ status: 'failed', error: payment.error_description || 'Payment declined' });
        }
      }
    }

    const ordPayRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    if (ordPayRes.ok) {
      const data: any = await ordPayRes.json();
      const captured = (data?.items || []).find((p: any) => p.status === 'captured' || p.status === 'authorized');
      if (captured) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(c.env.RAZORPAY_KEY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}|${captured.id}`));
        const signature = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        return c.json({
          status: 'paid',
          razorpay_order_id: orderId,
          razorpay_payment_id: captured.id,
          razorpay_signature: signature,
          method: captured.method || 'upi'
        });
      }
    }
    return c.json({ status: 'pending', razorpay_order_id: orderId });
  } catch {
    return c.json({ status: 'pending', razorpay_order_id: orderId });
  }
});

const verifyPaymentHandler = async (c: any) => {
  const user = c.get('user') || await verifyAuth(c);
  
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, package_id, user_id } = await c.req.json();
    const env = c.env;
    const supabase = getSupabase(env);
    const targetUserId = user?.id || user_id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return c.json({ error: 'Missing payment verification credentials' }, 400);
    }

    const isValid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, env.RAZORPAY_KEY_SECRET);
    if (!isValid) return c.json({ error: 'Invalid payment signature' }, 400);

    const { data: order } = await supabase.from('razorpay_orders')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('razorpay_order_id', razorpay_order_id).select().single();

    if (targetUserId) {
      const pkgId = package_id || order?.package_id;
      await Promise.all([
        supabase.from('profiles').update({ package_id: pkgId }).eq('id', targetUserId),
        supabase.from('enrollments').upsert({ user_id: targetUserId, package_id: pkgId, status: 'active' })
      ]);
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};

api.post('/payment/verify', verifyPaymentHandler);
api.post('/payments/verify', verifyPaymentHandler);
api.post('/update-order', verifyPaymentHandler);

// --- PROFILE & USER ROUTES ---
api.get('/profile', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return c.json({ error: 'Not found' }, 404);

  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  
  return c.json({
    ...profile,
    wallet_balance: wallet?.balance || profile.wallet_balance || 0,
    pending_balance: wallet?.pending_balance || 0,
    approved_balance: wallet?.approved_balance || (wallet?.balance || profile.wallet_balance || 0),
    total_earned: wallet?.total_earned || profile.total_earned || 0
  });
});

api.get('/profile/:id', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (user.id !== c.req.param('id') && user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
  
  const supabase = getSupabase(c.env);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', c.req.param('id')).single();
  if (!profile) return c.json({ error: 'Not found' }, 404);

  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', c.req.param('id')).single();
  
  return c.json({
    ...profile,
    wallet_balance: wallet?.balance || profile.wallet_balance || 0,
    pending_balance: wallet?.pending_balance || 0,
    approved_balance: wallet?.approved_balance || (wallet?.balance || profile.wallet_balance || 0),
    total_earned: wallet?.total_earned || profile.total_earned || 0
  });
});

api.post('/update-profile', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const updates = await c.req.json();
  
  const { data, error } = await getSupabase(c.env)
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
    
  return c.json(data || { error: error?.message });
});

api.get('/courses/:id', async (c) => {
  const { data } = await getSupabase(c.env).from('courses').select('*').eq('id', c.req.param('id')).single();
  return c.json(data ? mapCourseImages(data, c.env.CLOUDINARY_CLOUD_NAME) : { error: 'Not found' });
});

api.get('/enrolled-courses/:userId', async (c) => {
  const userId = c.req.param('userId');
  const user = c.get('user') || await verifyAuth(c);
  if (!user || (user.id !== userId && user.role !== 'admin')) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const [profileRes, enrollmentsRes, allCoursesRes, allPackagesRes] = await Promise.all([
    supabase.from('profiles').select('package_id, role').eq('id', userId).maybeSingle(),
    supabase.from('enrollments').select('package_id').eq('user_id', userId).eq('status', 'active'),
    supabase.from('courses').select('*'),
    supabase.from('packages').select('id, courses')
  ]);

  const allCourses = Array.isArray(allCoursesRes.data) ? allCoursesRes.data : [];
  const role = profileRes.data?.role || user.role || 'user';
  if (role === 'admin' || role === 'owner') {
    return c.json(allCourses.map(co => mapCourseImages(co, c.env.CLOUDINARY_CLOUD_NAME)));
  }

  const ownedPkgIds = new Set<string>();
  if (profileRes.data?.package_id) ownedPkgIds.add(String(profileRes.data.package_id));
  (enrollmentsRes.data || []).forEach((e: any) => {
    if (e.package_id) ownedPkgIds.add(String(e.package_id));
  });

  if (ownedPkgIds.size === 0) return c.json([]);

  const allowedCourseIds = new Set<string>();
  (allPackagesRes.data || []).forEach((pkg: any) => {
    if (ownedPkgIds.has(String(pkg.id)) && pkg.courses) {
      const ids = Array.isArray(pkg.courses)
        ? pkg.courses
        : typeof pkg.courses === 'string'
        ? pkg.courses.replace(/[\[\]"]/g, '').split(',')
        : [];
      ids.forEach((cid: any) => {
        const clean = String(cid).trim();
        if (clean) allowedCourseIds.add(clean);
      });
    }
  });

  const matched = allCourses.filter((co: any) =>
    allowedCourseIds.has(String(co.id)) || (co.package_id && ownedPkgIds.has(String(co.package_id)))
  );
  return c.json(matched.map(co => mapCourseImages(co, c.env.CLOUDINARY_CLOUD_NAME)));
});

api.get('/user-stats/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const [referrals, enrollments] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referred_by', user.id),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);
  
  return c.json({
    referralCount: referrals.count || 0,
    enrollmentCount: enrollments.count || 0
  });
});

// --- DASHBOARD AGGREGATED ENDPOINT ---
api.get('/dashboard', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const [profile, referrals, enrollments] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referred_by', user.id),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);
  
  return c.json({
    profile: profile.data || null,
    referralsCount: referrals.count || 0,
    enrollmentsCount: enrollments.count || 0,
    success: true
  });
});

api.get('/user-packages', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const { data } = await supabase.from('enrollments').select('*, packages(*)').eq('user_id', user.id);
  const mappedData = (data || []).map((item: any) => ({
    ...item,
    packages: mapPackageImages(item.packages, c.env.CLOUDINARY_CLOUD_NAME)
  }));
  return c.json({
    success: true,
    packages: mappedData
  });
});

// --- WITHDRAWALS ---
const payoutPostHandler = async (c: any) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const supabase = getSupabase(c.env);
  
  const { error } = await supabase.from('payout_requests').insert({ 
    user_id: user.id, 
    amount: body.amount,
    method: body.method || 'UPI',
    status: 'pending', 
    created_at: new Date() 
  });
  
  // Also track in withdrawals table for backwards compatibility
  await supabase.from('withdrawals').insert({
    user_id: user.id,
    amount: body.amount,
    method: body.method || 'UPI',
    status: 'pending',
    created_at: new Date()
  });

  return c.json({ success: !error });
};

api.post('/withdraw', payoutPostHandler);
api.post('/payouts', payoutPostHandler);

// --- ADMIN MANAGEMENT ENDPOINTS ---
api.get('/admin-get-stats', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  
  const supabase = getSupabase(c.env);
  const [users, orders, courses, payouts, transactions] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('razorpay_orders').select('amount').eq('status', 'paid'),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('payout_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('transactions').select('amount').gt('amount', 0)
  ]);
  
  return c.json({
    totalUsers: users.count || 0,
    totalRevenue: orders.data?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0,
    totalCourses: courses.count || 0,
    pendingWithdrawals: payouts.count || 0,
    totalPayouts: transactions.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
  });
});

api.get('/admin/users', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { data } = await getSupabase(c.env).from('profiles').select('*').order('created_at', { ascending: false });
  return c.json(data || []);
});

api.get('/admin/payments', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { data } = await getSupabase(c.env).from('razorpay_orders').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
  return c.json(data || []);
});

api.get('/admin/tickets', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { data } = await getSupabase(c.env).from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
  return c.json(data || []);
});

api.post('/admin/reply-ticket', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { ticketId, ticket_id, reply } = await c.req.json();
  const id = ticketId || ticket_id;
  const { error } = await getSupabase(c.env).from('support_tickets').update({ 
    admin_reply: reply, 
    status: 'closed', 
    updated_at: new Date() 
  }).eq('id', id);
  return c.json({ success: !error });
});

api.get('/admin/payouts', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { data } = await getSupabase(c.env).from('payout_requests').select('*, profiles(full_name, email, wallet_balance)').order('created_at', { ascending: false });
  return c.json(data || []);
});

api.post('/admin/handle-payout', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { payoutId, payout_id, status } = await c.req.json();
  const id = payoutId || payout_id;
  const supabase = getSupabase(c.env);
  
  const { data: payout } = await supabase.from('payout_requests').select('*').eq('id', id).single();
  if (!payout) return c.json({ error: 'Payout not found' }, 404);

  if (status === 'approved' && payout.status === 'pending') {
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', payout.user_id).single();
    if (profile && profile.wallet_balance >= payout.amount) {
      await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance - payout.amount }).eq('id', payout.user_id);
    }
  }

  const { error } = await supabase.from('payout_requests').update({ status, updated_at: new Date() }).eq('id', id);
  return c.json({ success: !error });
});

// --- MISC SUPPORT / TICKETS ---
api.post('/support/tickets', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('support_tickets').insert({ ...body, user_id: user.id, status: 'open', created_at: new Date() });
  return c.json({ success: !error });
});

api.get('/support/tickets/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || (user.id !== c.req.param('userId') && user.role !== 'admin')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('support_tickets').select('*').eq('user_id', c.req.param('userId')).order('created_at', { ascending: false });
  return c.json(data || []);
});

// --- UPLOADS ---
const uploadSignHandler = async (c: any) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const folder = c.req.query('folder') || 'user_uploads';
  const timestamp = Math.round(new Date().getTime() / 1000);
  const env = c.env as Bindings;
  
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return c.json({ signature, timestamp, apiKey: env.CLOUDINARY_API_KEY, cloudName: env.CLOUDINARY_CLOUD_NAME });
};
api.get('/upload/sign', uploadSignHandler);
api.get('/upload/signature', uploadSignHandler);

// --- LESSONS & PROGRESS ---
api.post('/lesson-completions', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('lesson_completions').upsert({ ...body, user_id: user.id });
  return c.json({ success: !error });
});

api.get('/lesson-completions', async (c) => {
  const userId = c.req.query('userId');
  const courseId = c.req.query('courseId');
  if (!userId || !courseId) return c.json({ error: 'Missing params' }, 400);
  const { data } = await getSupabase(c.env).from('lesson_completions').select('lesson_id').eq('user_id', userId).eq('course_id', courseId);
  return c.json(data || []);
});

// --- KYC ROUTINGS ---
api.get('/kyc/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || (user.id !== c.req.param('userId') && user.role !== 'admin')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('kyc_records').select('*').eq('user_id', c.req.param('userId')).single();
  return c.json(data || { status: 'none' });
});

api.post('/kyc', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('kyc_records').upsert({ ...body, user_id: user.id, status: 'pending', created_at: new Date() });
  return c.json({ success: !error });
});

// --- WALLET ENDPOINTS ---
api.get('/wallet/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
  const { data: profile } = await supabase.from('profiles').select('wallet_balance, total_earned').eq('id', user.id).single();
  
  return c.json({
    wallet_balance: wallet?.balance || profile?.wallet_balance || 0,
    pending_balance: wallet?.pending_balance || 0,
    approved_balance: wallet?.approved_balance || (wallet?.balance || profile?.wallet_balance || 0),
    total_earned: wallet?.total_earned || profile?.total_earned || 0
  });
});

api.get('/transactions/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const limit = Number(c.req.query('limit')) || 50;
  const { data } = await getSupabase(c.env).from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit);
  return c.json(data || []);
});

api.get('/orders/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('razorpay_orders').select('*, packages(name)').eq('user_id', user.id).order('created_at', { ascending: false });
  return c.json(data || []);
});

// --- NOTIFICATIONS ---
api.get('/notifications/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return c.json(data || []);
});

api.patch('/notifications/:id', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('notifications').update(body).eq('id', c.req.param('id')).eq('user_id', user.id);
  return c.json({ success: !error });
});

api.delete('/notifications/:id', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { error } = await getSupabase(c.env).from('notifications').delete().eq('id', c.req.param('id')).eq('user_id', user.id);
  return c.json({ success: !error });
});

// --- COURSE CONTENT ---
api.get('/courses/:id/content', async (c) => {
  const supabase = getSupabase(c.env);
  const courseId = c.req.param('id');
  
  const [sections, lessons] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', courseId).order('order_index', { ascending: true }),
    supabase.from('course_lessons').select('*').eq('course_id', courseId).order('order_index', { ascending: true })
  ]);
  
  return c.json({
    sections: sections.data || [],
    lessons: lessons.data || []
  });
});

api.get('/course-progress/:userId/:courseId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('course_progress').select('*').eq('user_id', user.id).eq('course_id', c.req.param('courseId'));
  return c.json(data || []);
});

api.get('/payouts/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const { data } = await supabase.from('payout_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return c.json(data || []);
});

api.get('/withdrawal-methods/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('withdrawal_methods').select('*').eq('user_id', user.id);
  return c.json(data || []);
});

api.post('/withdrawal-methods', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('withdrawal_methods').insert({ ...body, user_id: user.id });
  return c.json({ success: !error });
});

// --- REFERRALS ---
api.get('/referral-codes/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || (user.id !== c.req.param('userId') && user.role !== 'admin')) return c.json({ error: 'Unauthorized' }, 401);
  
  const supabase = getSupabase(c.env);
  const { data: codes, error } = await supabase.from('referral_codes').select('*').eq('user_id', c.req.param('userId'));
  
  if (error || !codes || codes.length === 0) {
    const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', c.req.param('userId')).single();
    if (profile?.referral_code) {
      return c.json([{ id: 'main', code: profile.referral_code, discount_percent: 10, earning_percent: 60, clicks: 0, enrollments: 0 }]);
    }
    return c.json([]);
  }
  return c.json(codes);
});

api.post('/referral-codes', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const supabase = getSupabase(c.env);
  
  const { data, error } = await supabase.from('referral_codes').insert({ 
    ...body, 
    user_id: user.id 
  }).select().single();
  
  if (error) return c.json({ error: error.message }, 400);
  return c.json(data);
});

api.delete('/referral-codes/:id', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { error } = await getSupabase(c.env).from('referral_codes').delete().eq('id', c.req.param('id')).eq('user_id', user.id);
  return c.json({ success: !error });
});

api.get('/referrals', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('profiles').select('id, full_name, created_at, profile_pic, username, email, mobile, city, state, pin_code, dob, gender, packages(name)').eq('referred_by', user.id).order('created_at', { ascending: false });
  return c.json(data || []);
});

api.get('/referrals/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || (user.id !== c.req.param('userId') && user.role !== 'admin')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('profiles').select('id, full_name, created_at, profile_pic, username, email, mobile, city, state, pin_code, dob, gender, packages(name)').eq('referred_by', c.req.param('userId')).order('created_at', { ascending: false });
  return c.json(data || []);
});

api.get('/validate-referral', async (c) => {
  const code = c.req.query('code');
  const supabase = getSupabase(c.env);
  
  const { data: refCode } = await supabase.from('referral_codes').select('*').eq('code', code).single();
  if (refCode) return c.json(refCode);
  
  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('referral_code', code).single();
  if (profile) return c.json({ ...profile, discount_percent: 10 });
  
  return c.json({ error: 'Invalid code' }, 404);
});

api.post('/referral-click', async (c) => {
  const { code } = await c.req.json();
  const supabase = getSupabase(c.env);
  await supabase.rpc('increment_referral_clicks', { referral_code: code });
  return c.json({ success: true });
});

// --- OTHER SPECIFICS ---
api.get('/site-settings', async (c) => {
  const { data } = await getSupabase(c.env).from('site_settings').select('*').single();
  return c.json(data || {});
});

api.post('/sync-password', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { password } = await c.req.json();
  const { error } = await getSupabase(c.env).auth.admin.updateUserById(user.id, { password });
  return c.json({ success: !error });
});

api.get('/user-uploads/:userId', async (c) => {
  const { data } = await getSupabase(c.env).from('user_uploads').select('*').eq('user_id', c.req.param('userId'));
  return c.json(data || []);
});

api.post('/user-uploads', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('user_uploads').insert({ ...body, user_id: user.id });
  return c.json({ success: !error });
});

api.get('/enrollments/:userId', async (c) => {
  const { data } = await getSupabase(c.env).from('enrollments').select('*, packages(name)').eq('user_id', c.req.param('userId'));
  return c.json(data || []);
});

api.get('/profile-requests/:userId', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user || user.id !== c.req.param('userId')) return c.json({ error: 'Unauthorized' }, 401);
  const { data } = await getSupabase(c.env).from('profile_requests').select('*').eq('user_id', user.id).eq('status', 'pending');
  return c.json(data || []);
});

api.post('/profile-requests', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  const { error } = await getSupabase(c.env).from('profile_requests').insert({ ...body, user_id: user.id, status: 'pending', created_at: new Date() });
  return c.json({ success: !error });
});

api.post('/admin-action', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!await verifyAdmin(c, user)) return c.json({ error: 'Forbidden' }, 403);
  const { action, table, data, id } = await c.req.json();
  const supabase = getSupabase(c.env);
  let res;
  if (action === 'insert') res = await supabase.from(table).insert(data).select();
  else if (action === 'update') res = await supabase.from(table).update(data).eq('id', id).select();
  else if (action === 'delete') res = await supabase.from(table).delete().eq('id', id).select();
  return c.json(res?.data || { error: res?.error?.message });
});

// AI CHAT
api.post('/ai/chat', async (c) => {
  const user = c.get('user') || await verifyAuth(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const { message } = await c.req.json();
  const env = c.env;
  
  const prompt = `You are the helpful AI Assistant for "The Smart Worth" (TSW) platform. User: ${user.user_metadata?.full_name || 'Student'}. Question: ${message}`;
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having trouble thinking right now.";
  return c.json({ reply });
});

// 4. MAIN APP ROUTINGS
// Informational / health check routes registered FIRST on main app so they match exactly
app.get('/api/health', (c) => c.json({ status: 'online', version: '2.1.0', time: new Date().toISOString() }));
app.get('/health', (c) => c.json({ status: 'online', version: '2.1.0', time: new Date().toISOString() }));

app.get('/api', (c) => {
  console.log('[Worker] /api route hit! Path:', c.req.path);
  return c.json({ success: true, message: 'TSW API v2.1.0 - Use specific endpoints' });
});

app.get('/', (c) => {
  console.log('[Worker] Root route hit! Path:', c.req.path, 'Full URL:', c.req.url);
  return c.json({ success: true, message: 'TSW Production API is running' });
});

// Mount prefix-independent Hono sub-app under BOTH paths to perfectly address routing configuration variations
app.route('/api', api);
app.route('/', api);

export default app;
