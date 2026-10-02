# Deployment Guide - The Smart Worth

Follow these steps to deploy your application safely to cPanel or any Node.js hosting environment without losing any data.

## Prerequisites
1.  **Node.js Hosting**: Ensure your cPanel has the "Setup Node.js App" feature.
2.  **Supabase Project**: Your live Supabase project URL and keys.
3.  **Razorpay Account**: Live API keys for payments.

---

## Step 1: Prepare the Production Build
Run the following command in your local terminal to generate the production-ready files:
```bash
npm run build
```
This will create a `dist/` folder containing the optimized frontend assets.

## Step 2: Environment Variables Setup
1.  In your cPanel, go to **Setup Node.js App**.
2.  Select the application you want to configure.
3.  Add the following **Environment Variables** (refer to `.env.example`):
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Keep this secret!).
    *   `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID.
    *   `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret.
    *   `RAZORPAY_WEBHOOK_SECRET`: Your Razorpay Webhook Secret.
    *   `VITE_ADMIN_EMAIL`: `helplinesmartworth@gmail.com`
    *   `NODE_ENV`: `production`

## Step 3: Upload Files to cPanel
1.  Compress the following files/folders into a ZIP:
    *   `dist/` (The build folder)
    *   `server.ts` (The backend server)
    *   `package.json`
    *   `package-lock.json`
    *   `tsconfig.json`
    *   `.env.example`
2.  Upload the ZIP to your application root directory in cPanel **File Manager**.
3.  Extract the ZIP.

## Step 4: Install Dependencies
1.  In **Setup Node.js App**, click **Run JS Install** or **npm install**.
2.  Wait for the process to complete.

## Step 5: Start the Application
1.  Set the **Application startup file** to `server.ts`.
2.  Restart the application.
3.  Your app should now be live at your domain.

---

## Database Safety (IMPORTANT)
*   **Existing Data**: Your data is stored in Supabase. This deployment only updates the code that connects to it.
*   **No Resets**: The application does not contain any code to reset or drop tables.
*   **Schema Updates**: If you need to add new tables, use the provided `schema.sql` in the Supabase SQL Editor. It uses `CREATE TABLE IF NOT EXISTS`, so it will never overwrite existing data.

## Troubleshooting
*   **White Screen**: Check if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set.
*   **Payment Fails**: Ensure Razorpay keys are live and the webhook URL is set to `https://yourdomain.com/api/razorpay-webhook`.
*   **Auth Issues**: Ensure your domain is added to the **Authorized Redirect URIs** in Supabase Auth settings.
