# Mobile Hosting Guide: Deploying Your Website from Your Phone

This guide will show you how to deploy your full-stack website using only your mobile phone.

## Prerequisites
1. A GitHub account.
2. A Supabase account (for database and auth).
3. A Razorpay account (for payments).
4. A hosting provider (we recommend **Render** or **Railway** as they are mobile-friendly).

---

## Step 1: Push Code to GitHub
If your code is not already on GitHub:
1. Open your mobile browser and go to [GitHub.com](https://github.com).
2. Create a new repository.
3. Use a mobile Git client like **Termux** (Android) or **Working Copy** (iOS) to push your code.
   - Alternatively, you can upload files directly through the GitHub web interface in "Desktop View".

## Step 2: Setup Database (Supabase)
1. Open [Supabase.com](https://supabase.com) on your phone.
2. Create a new project.
3. Go to the **SQL Editor**.
4. Copy the contents of `production_ready.sql` from your project and paste it into the SQL Editor.
5. Click **Run**. Your database tables and logic are now ready!

## Step 3: Hosting the Backend & Frontend (Render/Railway)
We recommend **Render** because it handles Node.js and static files easily.

1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. **Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Environment Variables**:
   Add all variables from your `.env.example`:
   - `VITE_SUPABASE_URL`: (From Supabase Settings > API)
   - `VITE_SUPABASE_ANON_KEY`: (From Supabase Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY`: (From Supabase Settings > API)
   - `VITE_RAZORPAY_KEY_ID`: (From Razorpay Dashboard)
   - `RAZORPAY_KEY_SECRET`: (From Razorpay Dashboard)
   - `RAZORPAY_WEBHOOK_SECRET`: (From Razorpay Dashboard)
   - `VITE_ADMIN_EMAIL`: `helplinesmartworth@gmail.com`

## Step 4: Setup Razorpay Webhook
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings > Webhooks**.
3. Add a new webhook.
4. **Webhook URL**: `https://your-app-url.onrender.com/api/razorpay-webhook`
5. **Secret**: (Create a random string and add it to your environment variables as `RAZORPAY_WEBHOOK_SECRET`).
6. **Events to Select**: `order.paid`.

---

## Tips for Mobile Management
- Use **Vercel** or **Netlify** if you want to host the frontend separately (Static Hosting).
- Use **Termux** on Android for a full Linux terminal experience on your phone.
- Use **Kiwi Browser** or **Chrome** in "Desktop Site" mode for better control over dashboards.

Your website is now live and ready for real users!
