# Quick Start Guide - New Features

## 🚀 Getting Started

### Step 1: Apply Database Migration

You need to apply the database changes before using the new features.

**Option A: Using Supabase CLI (Recommended)**
```bash
cd myshop
supabase migration up
```

**Option B: Using Supabase Dashboard**
1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20240605_add_payment_methods_and_notifications.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

### Step 2: Test the Features

#### Test Order Notifications
1. Open your storefront (e.g., `http://localhost:5173/store/your-store-slug`)
2. Click "Buy Item" on any product
3. Fill in the checkout form with your email address
4. Submit the order
5. Check the `order_notifications` table in Supabase to see the created notifications

#### Test Payment Methods
1. Log into your vendor dashboard
2. Click the **"Payment Methods"** button in the Quick Actions section
3. Enable Bank Transfer and fill in your bank details
4. Enable Mobile Money and add your provider info
5. Click **"Save Payment Methods"**
6. Verify the data was saved by checking the `profiles` table

---

## 📋 What's New

### For Customers
- **Email Collection**: Customers now provide their email during checkout
- **Order Confirmations**: Automatic order confirmation notifications (email delivery requires setup)

### For Vendors
- **Payment Methods Configuration**: Set up bank transfer, mobile money, and cash on delivery
- **Order Notifications**: Automatic notifications when new orders arrive
- **Easy Management**: Simple modal interface to configure all payment options

---

## 🔧 Technical Details

### Database Changes
- New table: `order_notifications`
- New column: `profiles.payment_methods` (JSONB)
- New column: `orders.customer_email`
- Database trigger for automatic notification creation

### Frontend Changes
- `StoreFront.jsx`: Email input in checkout form
- `VendorDashboard.jsx`: Payment methods modal and functions

---

## 📧 Setting Up Email Delivery (Optional)

The notification system creates records in the database, but to actually send emails, you need to set up an email service:

### Recommended: Resend
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Create a Supabase Edge Function to process notifications
4. Send emails using the Resend API

### Alternative: Supabase Webhooks
1. Use Supabase's built-in webhook feature
2. Send notifications to Zapier/Make.com
3. Configure email actions in those services

---

## 🆘 Troubleshooting

### Migration Fails
- Ensure you're connected to the correct Supabase project
- Check for any existing columns/tables that might conflict
- Run the SQL statements one by one in the SQL Editor

### Payment Methods Not Saving
- Check browser console for errors
- Verify the `profiles` table has the `payment_methods` column
- Ensure you're logged in as a vendor

### Order Notifications Not Creating
- Verify the database trigger was created successfully
- Check that the `customer_email` column exists in the `orders` table
- Ensure the `order_notifications` table exists

---

## 📚 Documentation

- Full implementation details: `IMPLEMENTATION_SUMMARY.md`
- Database schema: `supabase/schema.sql`
- Migration file: `supabase/migrations/20240605_add_payment_methods_and_notifications.sql`

---

## ✨ Next Steps

1. **Apply the migration** (see Step 1 above)
2. **Test both features** (see Step 2 above)
3. **Set up email delivery** (optional, see section above)
4. **Customize payment methods** to match your business needs
5. **Add payment gateway integration** for online payments

---

**Need Help?** Check the full implementation guide in `IMPLEMENTATION_SUMMARY.md`