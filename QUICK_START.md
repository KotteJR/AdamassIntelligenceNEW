# 🚀 Quick Start - Get Stripe Working in 10 Minutes

## What You Need
- Stripe account (sign up at https://stripe.com)
- Supabase project
- Your app deployed (or localhost for testing)

---

## Step 1: Stripe Setup (5 min)

### Create Products in Stripe

1. **Login to Stripe Dashboard**: https://dashboard.stripe.com
2. **Switch to LIVE MODE** (toggle in top right)
3. **Go to Products** → Click "Add product"

#### Pro Plan:
- Name: `Pro Plan`
- Price: `$29.00 USD / month` (recurring)
- Click "Add product"
- **COPY THE PRICE ID** → Save it (starts with `price_`)

#### Enterprise Plan:
- Name: `Enterprise Plan`  
- Price: `$99.00 USD / month` (recurring)
- Click "Add product"
- **COPY THE PRICE ID** → Save it

### Get Your API Keys

1. **Go to Developers** → **API keys**
2. Make sure you're in **LIVE mode**
3. Copy:
   - Publishable key (`pk_live_...`)
   - Secret key (`sk_live_...`) - Click "Reveal"

### Setup Webhook

1. **Go to Developers** → **Webhooks**
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **COPY THE SIGNING SECRET** (`whsec_...`)

---

## Step 2: Update Environment (1 min)

Create `.env.local` with:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Price IDs (paste the ones you copied)
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_ID

# Your domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Step 3: Database Setup (2 min)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Copy everything from `stripe_migration_simple.sql`
4. Click "Run"
5. ✅ Done!

---

## Step 4: Deploy & Test (2 min)

```bash
# Build
npm run build

# Deploy (Vercel, etc.)
vercel deploy --prod
```

### Test It:
1. Go to `/pricing` on your site
2. Click "Subscribe" on Pro plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Go to `/subscription` - you should see your active subscription! 🎉

---

## How It Works With Your Users

### All Existing Users:
✅ Automatically get **FREE tier** (1 analysis/month)
✅ All their data stays safe
✅ Can upgrade anytime

### When Someone Subscribes:
1. User clicks "Subscribe"
2. Stripe handles payment (secure, PCI compliant)
3. Webhook updates your database automatically
4. User gets instant access to more analyses

### Analysis Limits:
- **Free**: 1/month
- **Pro**: 10/month  
- **Enterprise**: Unlimited

Resets automatically each billing cycle.

---

## Checking Subscription in Your Code

When user tries to create an analysis, the system automatically checks:

```typescript
// In your initiate-analysis API route
const { data: profile } = await supabase
  .from('user_profiles')
  .select('analyses_remaining, subscription_status')
  .eq('id', userId)
  .single();

if (profile.analyses_remaining <= 0 && profile.subscription_status !== 'active') {
  return { error: 'No analyses remaining. Please upgrade.' };
}

// Decrement count
await supabase.rpc('decrement_analysis_count', { user_uuid: userId });
```

---

## Troubleshooting

**Webhook not working?**
- Check Stripe Dashboard → Webhooks → Recent events
- Make sure URL is publicly accessible (not localhost)

**User not getting access?**
- Check Stripe Dashboard → Events for webhook delivery
- Verify `user_profiles` table updated in Supabase

**Want to test first?**
- Use TEST mode keys (`pk_test_`, `sk_test_`)
- Test card: `4242 4242 4242 4242`

---

## You're Done! 🎊

Your users can now:
- ✅ View pricing plans at `/pricing`
- ✅ Subscribe with credit card (Stripe Checkout)
- ✅ Manage subscription at `/subscription`
- ✅ Cancel anytime (through customer portal)
- ✅ Get charged automatically each month

**Stripe handles everything**: billing, failed payments, cancellations, receipts.

---

## Next Steps

- Add subscription check to your analysis creation
- Monitor in Stripe Dashboard
- Set up email notifications for failed payments
- Customize pricing tiers as needed

Need help? Check `STRIPE_SETUP_SIMPLE.md` for detailed docs.

