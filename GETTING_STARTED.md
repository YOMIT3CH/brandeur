# Getting Started with myshop

Quick start guide to get your multi-vendor e-commerce platform up and running.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase Database

### 2.1 Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project name: `myshop`
6. Enter database password (save this!)
7. Select region closest to you
8. Click "Create new project"

### 2.2 Get Your Credentials
1. In your Supabase project, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (e.g., `https://xyz123.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2.3 Update Environment Variables
1. Open `.env` in your project
2. Replace the values with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.4 Run Database Schema
1. In Supabase Dashboard, click **SQL Editor** in left sidebar
2. Click **New query**
3. Open `supabase/schema.sql` in your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

### 2.5 Verify Setup
1. Click **Table Editor** in left sidebar
2. You should see three tables: `profiles`, `products`, `orders`
3. Click **Storage** in left sidebar
4. You should see a bucket named `product-images`

## Step 3: Start Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

## Step 4: Test the Platform

### 4.1 Create a Vendor Account
1. Click **Get Started** button
2. Fill in the signup form:
   - Shop Name: `My Test Store`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **CREATE ACCOUNT**
4. You should be redirected to the dashboard

### 4.2 Add Your First Product
1. In the dashboard, click **Products** in the sidebar
2. Click **+ Add Product**
3. Fill in the product form:
   - Product Title: `Cool T-Shirt`
   - Description: `A really cool t-shirt`
   - Price: `29.99`
   - Category: `Clothing`
   - Image URL: `https://example.com/shirt.jpg` (or upload an image)
   - Check "In Stock"
4. Click **Add Product**

### 4.3 View Your Storefront
1. In the dashboard, look at the top section
2. You'll see "Your Storefront Routing Link"
3. Click **📋 COPY UNIQUE LINK**
4. Open a new browser tab
5. Paste the link (it should look like: `http://localhost:5173/store/your-shop-slug`)
6. You should see your store with your product!

### 4.4 Test Order Placement
1. On your storefront, click **Buy Item** on a product
2. Fill in the checkout form:
   - Address: `123 Main St`
   - Phone: `555-0192`
3. Click **TRANSMIT ORDER PAYLOAD**
4. You should see a success message

### 4.5 Manage Orders
1. Go back to your dashboard
2. Click **Orders Pipeline** in the sidebar
3. You should see your order!
4. Change the status from "Pending" to "Fulfilled"
5. Check the "Settled Earnings" in the overview

## Step 5: Customize Your Store

### Update Store Information
Currently, store information is set during signup. To add profile editing:

1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Find your user and click **Edit**
4. You can update user metadata here

### Add More Products
- Use the **Products** tab in the dashboard
- Upload images or use URLs
- Set prices and categories
- Mark as in/out of stock

### Share Your Store
- Copy your unique store link from the dashboard
- Share on social media, with friends, or customers
- No account needed for customers to purchase!

## Troubleshooting

### "relation 'profiles' does not exist"
- You didn't run the schema.sql file
- Go back to Step 2.4

### "new row violates row level security policy"
- Make sure you're logged in
- Check that RLS policies were created in schema.sql
- Verify you're using the correct Supabase credentials

### Images not uploading
- Check that the `product-images` storage bucket exists
- Verify file is under 5MB
- Check file type is allowed (JPEG, PNG, WebP, GIF)

### Can't see products on storefront
- Make sure products have `in_stock: true`
- Check that you're visiting the correct store URL
- Verify the store slug matches your profile

### Orders not appearing in dashboard
- Make sure you're logged in as the correct vendor
- Check that the order was created for your vendor_id
- Refresh the page

## Next Steps

### Production Deployment
1. Build the project: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Update your Supabase site URL in:
   - Supabase Dashboard → Authentication → URL Configuration
   - Add your production domain

### Custom Domain
1. Purchase a domain (e.g., `myshop.com`)
2. Configure in your hosting provider
3. Update Supabase site URL

### Payment Integration
- Integrate Stripe or Paystack for payments
- Update order creation to include payment intent
- Add payment webhooks

### Email Notifications
- Set up Supabase Edge Functions
- Send emails on new orders
- Send order confirmation to customers

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality

# Database
# (In Supabase SQL Editor)
SELECT * FROM profiles;           # View all vendors
SELECT * FROM products;           # View all products
SELECT * FROM orders;             # View all orders
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs in Dashboard → Logs
3. Review `supabase/SETUP.md` for detailed setup
4. Ensure all environment variables are correct

## What's Next?

- Customize the landing page design
- Add your logo and branding
- Configure email templates
- Set up analytics
- Add payment processing
- Deploy to production!

Happy selling! 🚀