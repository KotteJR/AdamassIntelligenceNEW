# Simple Stripe Setup Guide

## Step 1: Create Real Stripe Products (5 minutes)

### 1. Go to Stripe Dashboard
- Login to: https://dashboard.stripe.com
- **IMPORTANT**: Make sure you're in **LIVE MODE** (toggle in top right - should NOT say "Test mode")

### 2. Create Products

#### Product 1: Pro Plan
1. Go to **Products** → Click **Add product**
2. Fill in:
   - **Name**: `Pro Plan`
   - **Description**: `10 company analyses per month with audio reports, mind maps, SWOT analysis`
   - **Pricing**: 
     - One-time or recurring: **Recurring**
     - Price: `$29.00 USD`
     - Billing period: **Monthly**
   - Click **Add product**
3. **COPY THE PRICE ID** (looks like `price_xxxxxxxxxxxxx`)
   - Save this - you'll need it for `.env`

#### Product 2: Enterprise Plan
1. Go to **Products** → Click **Add product**
2. Fill in:
   - **Name**: `Enterprise Plan`
   - **Description**: `Unlimited company analyses with all features`
   - **Pricing**: 
     - One-time or recurring: **Recurring**
     - Price: `$99.00 USD`
     - Billing period: **Monthly**
   - Click **Add product**
3. **COPY THE PRICE ID** (looks like `price_xxxxxxxxxxxxx`)

---

## Step 2: Get Your Stripe Keys (2 minutes)

### 1. Get API Keys
- Go to **Developers** → **API keys**
- **IMPORTANT**: Make sure you're viewing **LIVE** keys (toggle says "Viewing live data")
- Copy these two keys:
  1. **Publishable key** (starts with `pk_live_`)
  2. **Secret key** (starts with `sk_live_`) - Click "Reveal test key"

### 2. Create Webhook
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - Replace `yourdomain.com` with your actual domain
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **COPY THE SIGNING SECRET** (starts with `whsec_`)

---

## Step 3: Update Environment Variables (1 minute)

Add these to your `.env.local` file:

```bash
# Stripe LIVE Keys
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Product Price IDs
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_PRICE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_PRICE_ID
```

---

## Step 4: Setup Database (2 minutes)

Run this SQL in your Supabase SQL Editor:

```sql
-- Add subscription fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS analyses_remaining INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS analyses_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_stripe ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Function to reset monthly analyses
CREATE OR REPLACE FUNCTION reset_monthly_analyses()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    analyses_remaining = analyses_limit,
    subscription_period_start = NOW(),
    subscription_period_end = NOW() + INTERVAL '1 month'
  WHERE subscription_period_end < NOW()
    AND subscription_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;
```

---

## Step 5: How It Works with Your Users

### For Existing Users (Automatically):
- **All existing users start on FREE plan**
  - 1 analysis per month
  - Can upgrade anytime
- Their data is safe and unchanged
- They can view their existing reports

### When Users Subscribe:
1. User clicks "Subscribe" on pricing page
2. They're redirected to Stripe Checkout (secure payment)
3. After payment:
   - Stripe webhook updates your database
   - User's `subscription_tier` changes to `pro` or `enterprise`
   - `analyses_remaining` increases to 10 (Pro) or unlimited (Enterprise)
   - They can immediately create more analyses

### Analysis Limits:
- **Free**: 1 analysis per month
- **Pro**: 10 analyses per month
- **Enterprise**: Unlimited analyses

Limits reset automatically on the billing cycle.

---

## Step 6: Test in Production

### 1. Deploy Your App
```bash
# Build and deploy
npm run build
# Deploy to your hosting (Vercel, etc.)
```

### 2. Test the Flow
1. Go to your pricing page
2. Click "Subscribe" on Pro plan
3. Complete checkout with a real card (or Stripe test card: `4242 4242 4242 4242`)
4. Check that:
   - You're redirected back
   - Your subscription appears in `/subscription` page
   - You can create analyses

### 3. Verify in Stripe Dashboard
- Go to **Customers** - you should see your user
- Go to **Subscriptions** - you should see the active subscription
- Check **Webhooks** - recent events should show successful webhook deliveries

---

## Important Notes

### Security
✅ Stripe handles all payment processing (PCI compliant)
✅ Webhooks verify signatures
✅ Never expose secret keys to frontend

### Billing
- Stripe automatically charges users monthly
- Users can cancel anytime from `/subscription` page
- Failed payments = subscription moves to `past_due` (they can't create analyses)
- You get email notifications for issues

### Testing Before Going Live
If you want to test first:
1. Use TEST mode keys (pk_test_, sk_test_)
2. Create test products
3. Test with card: 4242 4242 4242 4242
4. When ready, switch to LIVE mode keys

---

## Troubleshooting

**Webhook not working?**
- Make sure your domain is accessible (not localhost)
- Check webhook signing secret matches your .env
- View failed events in Stripe Dashboard → Webhooks

**User not getting access after payment?**
- Check Stripe Dashboard → Events
- Look for webhook delivery failures
- Verify database was updated (check `user_profiles` table)

**Need help?**
- Stripe docs: https://stripe.com/docs
- Stripe support: https://support.stripe.com

---

## Quick Checklist

- [ ] Created Pro product in Stripe (LIVE mode)
- [ ] Created Enterprise product in Stripe (LIVE mode)
- [ ] Copied both Price IDs
- [ ] Got Publishable and Secret keys (LIVE)
- [ ] Created webhook endpoint
- [ ] Got webhook signing secret
- [ ] Updated `.env.local` with all keys
- [ ] Ran database SQL migration
- [ ] Deployed app
- [ ] Tested subscription flow
- [ ] Verified webhook deliveries in Stripe

**You're ready to accept payments!** 🎉

