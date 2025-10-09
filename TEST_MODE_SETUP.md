# 🧪 Test Mode Setup - Working Test Environment

## Step 1: Create Test Products in Stripe (3 minutes)

### 1. Login and Switch to Test Mode
- Go to: https://dashboard.stripe.com
- **Toggle to "Test mode"** (top right corner - should show "Test mode" badge)

### 2. Create Test Products

#### Pro Plan (Test):
1. Go to **Products** → **Add product**
2. Fill in:
   - Name: `Pro Plan (Test)`
   - Description: `10 analyses per month`
   - Pricing: **Recurring** → `$29.00 USD` → **Monthly**
3. Click **Add product**
4. **COPY THE PRICE ID** (starts with `price_`) - you'll need this!

#### Enterprise Plan (Test):
1. **Add product** again
2. Fill in:
   - Name: `Enterprise Plan (Test)`
   - Description: `Unlimited analyses`
   - Pricing: **Recurring** → `$99.00 USD` → **Monthly**
3. Click **Add product**
4. **COPY THE PRICE ID**

---

## Step 2: Get Test API Keys (1 minute)

1. Go to **Developers** → **API keys**
2. Make sure you see "Viewing test data"
3. Copy these two keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal")

---

## Step 3: Setup Test Webhook (2 minutes)

### For Local Development (using Stripe CLI):

**Option A: Install Stripe CLI** (Recommended for local testing)
```bash
# Install Stripe CLI
# Mac:
brew install stripe/stripe-cli/stripe

# Windows: Download from https://github.com/stripe/stripe-cli/releases
```

```bash
# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will show you a webhook signing secret: whsec_...
# COPY THIS SECRET!
```

**Option B: Use ngrok for public URL**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Then create webhook in Stripe Dashboard:
# - URL: https://abc123.ngrok.io/api/stripe/webhook
# - Events: customer.subscription.*, invoice.paid, invoice.payment_failed
```

---

## Step 4: Update Your .env.local (1 minute)

Create/update `.env.local`:

```bash
# Supabase (your existing keys)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe TEST Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Test Price IDs (paste what you copied)
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_PRICE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_PRO_PRICE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_PRICE_ID

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Setup Database (1 minute)

Run this in **Supabase SQL Editor**:

```sql
-- Add subscription columns to user_profiles
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

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own customer data" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service can manage customers" ON customers FOR ALL USING (true);

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

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- Initialize existing users
UPDATE user_profiles
SET 
  subscription_tier = 'free',
  subscription_status = 'none',
  analyses_remaining = 1,
  analyses_limit = 1,
  subscription_period_start = NOW(),
  subscription_period_end = NOW() + INTERVAL '1 month'
WHERE subscription_tier IS NULL;
```

---

## Step 6: Start Your Dev Server (1 minute)

```bash
# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

**In another terminal** (if using Stripe CLI):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Step 7: Test the Flow! 🎉

### 1. Sign Up / Sign In
- Go to http://localhost:3000
- Sign up or sign in

### 2. View Pricing
- Click "Pricing" in the header
- You should see: Free ($0), Pro ($29), Enterprise ($99)

### 3. Test Subscription
- Click "Subscribe" on Pro plan
- Use Stripe test card: **4242 4242 4242 4242**
  - Expiry: Any future date (e.g., 12/25)
  - CVC: Any 3 digits (e.g., 123)
  - ZIP: Any 5 digits (e.g., 12345)
- Complete checkout

### 4. Verify Success
- You should be redirected back
- Go to `/subscription` page
- You should see:
  - ✅ **Pro** subscription
  - ✅ **10 analyses remaining**
  - ✅ Active status

### 5. Check Stripe Dashboard
- Go to Stripe Dashboard (Test mode)
- Check **Customers** - you should see your test customer
- Check **Subscriptions** - should show active subscription
- Check **Webhooks** - should show successful webhook events

---

## Test Cards

Use these cards to test different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Success (default) |
| `4000 0000 0000 9995` | Payment fails |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |

---

## Troubleshooting

### ❌ "Module not found" errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### ❌ Webhook not receiving events
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check webhook secret in `.env.local` matches CLI output
- Check terminal logs for webhook errors

### ❌ User not getting access after payment
1. Check Stripe CLI terminal - do you see webhook events?
2. Check your server logs - any errors?
3. Check Supabase - did `user_profiles` update?
   ```sql
   SELECT * FROM user_profiles WHERE id = 'your_user_id';
   ```

### ❌ "Not authenticated" error
- Make sure you're signed in
- Check browser console for errors
- Try signing out and back in

---

## How to Verify Everything Works

### Check 1: Database
```sql
-- Check your user profile
SELECT 
  email,
  subscription_tier,
  subscription_status,
  analyses_remaining,
  analyses_limit,
  stripe_customer_id
FROM user_profiles 
WHERE email = 'your@email.com';

-- Should show:
-- subscription_tier: 'pro'
-- subscription_status: 'active'
-- analyses_remaining: 10
-- analyses_limit: 10
-- stripe_customer_id: 'cus_...'
```

### Check 2: API Endpoints
Test these URLs work (while signed in):

```bash
# Get subscription status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/stripe/subscription-status

# Should return JSON with tier, status, analyses remaining
```

### Check 3: Stripe Dashboard
- Customers → Should see your test customer
- Subscriptions → Should see active subscription
- Webhooks → Should show green checkmarks (successful events)

---

## What Each API Does

### `/api/stripe/create-checkout-session` (POST)
- Creates a Stripe Checkout session
- User clicks "Subscribe" → redirects to Stripe
- Returns checkout URL

### `/api/stripe/webhook` (POST)
- Receives events from Stripe
- Updates database when subscription changes
- Called automatically by Stripe (not by your frontend)

### `/api/stripe/subscription-status` (GET)
- Returns current user's subscription info
- Used by `/subscription` page
- Shows tier, status, analyses remaining

### `/api/stripe/create-portal-session` (POST)
- Creates Stripe Customer Portal link
- User clicks "Manage Subscription"
- Lets them cancel/update payment

---

## Next Steps After Testing

Once everything works in test mode:

1. ✅ Test subscription flow
2. ✅ Test cancellation
3. ✅ Test failed payment scenario
4. ✅ Verify analysis limits work
5. 🚀 When ready: Switch to LIVE mode keys

---

## Quick Reference

**Test Card**: `4242 4242 4242 4242`  
**Stripe CLI**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`  
**Dashboard**: https://dashboard.stripe.com (Test mode)  
**Dev Server**: `npm run dev`

---

Need help? Check:
- Server logs (terminal running `npm run dev`)
- Stripe CLI logs (terminal running `stripe listen`)
- Browser console (F12)
- Stripe Dashboard → Events (see what's happening)

