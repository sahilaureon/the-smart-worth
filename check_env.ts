import dotenv from 'dotenv';
dotenv.config();

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY starts with:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));
console.log('SUPABASE_SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
console.log('RAZORPAY_KEY_ID length:', process.env.VITE_RAZORPAY_KEY_ID?.length || 0);
console.log('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length || 0);
