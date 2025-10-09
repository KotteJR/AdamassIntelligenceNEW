# Production Environment Variables Template

Copy these to your `.env.local` file and replace with your actual LIVE keys:

```bash
# ========================================
# STRIPE PRODUCTION (LIVE) CONFIGURATION
# ========================================

# Stripe Live Keys (from Stripe Dashboard → Developers → API Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

# Live Price IDs (from Stripe Dashboard → Products)
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_LIVE_PRO_PRICE_ID_HERE
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_LIVE_ENTERPRISE_PRICE_ID_HERE

# Webhook Secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE

# Production App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ========================================
# SUPABASE (Keep your existing values)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_supabase_service_role_key
```

## For Vercel/Netlify Deployment:

Add these same variables in your hosting platform's environment variables settings.

**Vercel:**
- Project Settings → Environment Variables

**Netlify:**
- Site Settings → Build & Deploy → Environment Variables

Make sure to select "Production" scope for all variables.

