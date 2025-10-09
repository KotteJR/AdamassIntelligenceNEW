# Stripe Integration - Quick Start Guide

This guide will get you up and running with Stripe payments in ~30 minutes.

## 🚀 Quick Setup (Development)

### Step 1: Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### Step 2: Get Your Stripe Keys

1. Sign up at [stripe.com](https://stripe.com) (it's free)
2. Go to [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
3. Copy your **Test mode** keys:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### Step 3: Add Environment Variables

Create or update `.env.local` with:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Create Products in Stripe

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click **+ Add product**

Create these products:

#### Product 1: Pro Plan
- **Name**: Pro Plan
- **Description**: 10 analyses per month with premium features
- **Pricing**: $29.00 USD / month
- Click **Save**
- Copy the **Price ID** (starts with `price_`)

#### Product 2: Enterprise Plan
- **Name**: Enterprise Plan
- **Description**: Unlimited analyses with all features
- **Pricing**: $99.00 USD / month
- Click **Save**
- Copy the **Price ID**

Add the price IDs to your `.env.local`:

```bash
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxx
```

### Step 5: Set Up Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy contents from stripe_schema.sql
```

Or go to your Supabase Dashboard:
1. Project → SQL Editor
2. Copy/paste contents of `stripe_schema.sql`
3. Click **Run**

### Step 6: Set Up Webhooks (Local Development)

Install Stripe CLI:

```bash
# Mac
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

Login and forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret (starts with `whsec_`) to `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 7: Start Your App

```bash
npm run dev
```

Open two terminals:
- Terminal 1: `npm run dev`
- Terminal 2: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Step 8: Test the Integration

1. Go to `http://localhost:3000/pricing`
2. Sign in to your account
3. Click "Subscribe Now" on a plan
4. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any valid ZIP code

---

## 📋 Integration Checklist

- [x] Installed Stripe packages
- [ ] Added Stripe keys to `.env.local`
- [ ] Created products in Stripe Dashboard
- [ ] Added price IDs to `.env.local`
- [ ] Ran database migration (`stripe_schema.sql`)
- [ ] Installed Stripe CLI
- [ ] Started webhook forwarding
- [ ] Tested checkout flow
- [ ] Tested subscription management
- [ ] Tested usage limits

---

## 🧪 Testing Scenarios

### Test Cards

| Scenario | Card Number | Behavior |
|----------|-------------|----------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |
| Insufficient funds | 4000 0000 0000 9995 | Insufficient funds |

### Test Workflows

1. **Subscribe to Pro Plan**
   - User subscribes → webhook fires → database updated → credits added

2. **Create Analysis with Active Subscription**
   - Check user can create analysis → decrement counter → analysis created

3. **Hit Usage Limit**
   - Free user creates 1 analysis → limit reached → prompted to upgrade

4. **Cancel Subscription**
   - Go to subscription manager → manage subscription → cancel → revert to free tier

5. **Subscription Renewal**
   - Wait for test subscription to renew (or simulate with webhook) → credits reset

---

## 🔧 Common Issues & Solutions

### Issue: "Missing STRIPE_SECRET_KEY"

**Solution**: Make sure `.env.local` exists and contains your Stripe keys. Restart your dev server after adding env variables.

### Issue: Webhook events not received

**Solution**: 
1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Check webhook secret is in `.env.local`
3. Check terminal for webhook events

### Issue: "No customer found" error

**Solution**: User needs to have completed checkout at least once. The customer record is created during checkout.

### Issue: Database permissions error

**Solution**: Make sure you ran the entire `stripe_schema.sql` file, including the RLS policies and grants.

---

## 📊 Understanding the Flow

### Checkout Flow
```
User clicks "Subscribe"
     ↓
Frontend: Create checkout session API call
     ↓
Backend: Create Stripe checkout session
     ↓
Redirect user to Stripe Checkout
     ↓
User completes payment
     ↓
Stripe webhook: checkout.session.completed
     ↓
Backend: Create/update subscription in database
     ↓
Backend: Grant user credits/access
     ↓
User redirected back to your app
```

### Analysis Creation Flow
```
User requests new analysis
     ↓
Backend: Check subscription status
     ↓
Has credits? → Yes: Create analysis, decrement counter
     ↓
            → No: Return error "Upgrade required"
```

### Subscription Management Flow
```
User clicks "Manage Subscription"
     ↓
Backend: Create portal session
     ↓
Redirect to Stripe Customer Portal
     ↓
User updates/cancels subscription
     ↓
Stripe webhook: subscription.updated/deleted
     ↓
Backend: Update database
     ↓
User redirected back to your app
```

---

## 🚀 Going to Production

When you're ready to go live:

1. **Switch to Live Keys**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Create Live Products**
   - Toggle to "Live mode" in Stripe Dashboard
   - Recreate your products/prices
   - Update price IDs in env variables

3. **Set Up Production Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select same events as test mode
   - Copy webhook secret to production env

4. **Update App URL**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

5. **Deploy**
   - Push to your hosting platform
   - Add all env variables
   - Test with real card (small amount)

6. **Enable Stripe Features** (Optional but recommended)
   - [Stripe Tax](https://stripe.com/tax) - Automatic tax calculation
   - [Stripe Billing](https://stripe.com/billing) - Advanced billing features
   - Email notifications for customers
   - Revenue Recognition reports

---

## 📱 Usage Tracking Dashboard

To see your usage data, query the database:

```sql
-- See all subscriptions
SELECT 
  s.id,
  s.status,
  s.price_id,
  p.email,
  p.subscription_tier
FROM subscriptions s
JOIN user_profiles p ON s.user_id = p.id
WHERE s.status = 'active';

-- See usage for a user
SELECT 
  user_id,
  record_type,
  quantity,
  timestamp
FROM usage_records
WHERE user_id = 'user-uuid-here'
ORDER BY timestamp DESC;

-- See revenue metrics
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_subscriptions,
  SUM(amount) as total_revenue
FROM payments
WHERE status = 'succeeded'
GROUP BY month
ORDER BY month DESC;
```

---

## 🎓 Next Steps

1. **Customize pricing tiers** - Edit values in `lib/stripe.ts`
2. **Add usage tracking** - Call `decrementAnalysisCount()` when analysis is created
3. **Implement one-time purchases** - Add "Buy Single Analysis" button
4. **Email notifications** - Use Stripe's email or integrate with SendGrid/Postmark
5. **Analytics** - Track conversions, churn, MRR in Stripe Dashboard
6. **Coupons** - Create promo codes in Stripe Dashboard
7. **Trials** - Add trial periods to your subscriptions

---

## 🆘 Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Discord](https://discord.gg/stripe)
- [Supabase + Stripe Guide](https://supabase.com/docs/guides/integrations/stripe)
- Check `STRIPE_INTEGRATION_GUIDE.md` for detailed explanations

---

## ✅ Final Check

Before going live, verify:

- [ ] Webhooks are working (check Stripe Dashboard → Webhooks)
- [ ] Test subscriptions in test mode
- [ ] Test cancellations and refunds
- [ ] Test usage limits
- [ ] Test different payment methods
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Have customer support plan
- [ ] Legal: Terms of Service, Privacy Policy
- [ ] Legal: Refund policy
- [ ] Business: Set up payout schedule

---

**You're all set! 🎉**
