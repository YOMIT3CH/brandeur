# myshop - Multi-Vendor E-Commerce Platform

A modern, affordable e-commerce solution for vendors who can't afford expensive websites. Create an account, get your unique storefront link, and start selling in minutes.

## Features

### For Vendors
- **Instant Store Setup** - Create an account and get your unique storefront link
- **Product Management** - Add, edit, and delete products with ease
- **Image Upload** - Upload product images directly to cloud storage
- **Order Management** - Track and manage customer orders
- **Real-time Dashboard** - View stats, revenue, and order status
- **Unique Store Links** - Share your custom storefront URL with customers

### For Customers
- **Browse Stores** - Visit vendor stores via unique links
- **Easy Checkout** - Simple order placement with address and phone
- **No Account Required** - Shop without signing up
- **Mobile Friendly** - Responsive design for all devices

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router DOM v7
- **Deployment**: Ready for Vercel, Netlify, or any static host

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (https://supabase.com)
- Supabase project credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd myshop
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up the database:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Run the schema from `supabase/schema.sql`
   - See `supabase/SETUP.md` for detailed instructions

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## Project Structure

```
myshop/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx      # Marketing homepage
│   │   ├── AuthPage.jsx         # Login/Signup forms
│   │   ├── VendorDashboard.jsx  # Vendor management panel
│   │   └── StoreFront.jsx       # Public storefront
│   ├── hooks/
│   │   └── useImageUpload.js    # Image upload utility
│   ├── lib/
│   │   └── supabaseClient.js    # Supabase configuration
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── supabase/
│   ├── schema.sql               # Database schema & RLS policies
│   └── SETUP.md                 # Database setup guide
├── .env                         # Environment variables
├── package.json
└── vite.config.js
```

## Database Schema

### Tables

#### `profiles` - Vendor Information
- `id` - References auth.users(id)
- `store_name` - Display name
- `store_slug` - URL-friendly unique identifier
- `store_description` - Shop description
- `store_phone` - Contact phone
- `store_address` - Physical address
- `avatar_url` - Profile image

#### `products` - Vendor Catalog
- `id` - Unique product ID
- `vendor_id` - References profiles(id)
- `title` - Product name
- `description` - Product details
- `price` - Product price
- `image_url` - Product image
- `category` - Product category
- `tags` - Array of tags
- `in_stock` - Availability status

#### `orders` - Customer Purchases
- `id` - Unique order ID
- `vendor_id` - References profiles(id)
- `items` - JSONB array of items
- `total` - Order total
- `address` - Delivery address
- `phone` - Contact phone
- `status` - Order status (Pending/Processing/Fulfilled/Cancelled)
- `customer_email` - Optional email
- `notes` - Order notes

## Key Features Explained

### Automatic Profile Creation
When a vendor signs up, a profile is automatically created using a database trigger. The profile includes the store name and slug from the signup form.

### Row Level Security (RLS)
All tables have RLS policies ensuring:
- Vendors can only access their own data
- Public can view active products
- Anyone can create orders
- Secure data isolation between vendors

### Image Upload
Product images are uploaded to Supabase Storage with:
- File type validation (JPEG, PNG, WebP, GIF)
- File size limit (5MB)
- Unique file naming
- Automatic cleanup on product deletion

### Unique Store Links
Each vendor gets a unique URL: `yoursite.com/store/{vendor-slug}`

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Security

- Row Level Security (RLS) on all database tables
- Secure authentication via Supabase Auth
- File upload validation and restrictions
- XSS protection via React
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions:
1. Check the `supabase/SETUP.md` guide
2. Review the database schema in `supabase/schema.sql`
3. Open an issue on GitHub

## Roadmap

- [ ] Payment integration (Stripe/Paystack)
- [ ] Email notifications for orders
- [ ] Product categories and filters
- [ ] Advanced analytics
- [ ] Multi-image upload per product
- [ ] Product variants (size, color, etc.)
- [ ] Discount codes and coupons
- [ ] Customer reviews and ratings
- [ ] Admin panel for platform management
- [ ] Mobile app (React Native)

## Acknowledgments

Built with modern web technologies to provide affordable e-commerce solutions for small vendors worldwide.