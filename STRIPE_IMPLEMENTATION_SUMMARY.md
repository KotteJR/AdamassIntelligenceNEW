# Stripe Integration - Implementation Summary

## ✅ What Has Been Created

I've created a complete Stripe integration for your Adamass Intelligence platform. Here's what you now have:

### 📁 Documentation Files

1. **STRIPE_INTEGRATION_GUIDE.md** - Comprehensive integration guide
2. **STRIPE_QUICKSTART.md** - Step-by-step quick start guide
3. **stripe_schema.sql** - Database schema for Stripe data
4. **.env.example** - Example environment variables

### 🔧 Backend Files (Server-Side)

1. **lib/stripe.ts** - Server-side Stripe client and configuration
2. **lib/stripe-client.ts** - Client-side Stripe utilities (optional, kept for reference)
3. **lib/subscriptionCheck.ts** - Subscription validation and usage tracking

### 🌐 API Routes

1. **app/api/stripe/create-checkout-session/route.ts** - Creates Stripe checkout sessions
2. **app/api/stripe/create-portal-session/route.ts** - Creates customer portal sessions
3. **app/api/stripe/webhook/route.ts** - Handles Stripe webhook events
4. **app/api/stripe/subscription-status/route.ts** - Gets user subscription status

### 🎨 Frontend Components

1. **app/components/PricingTable.tsx** - Beautiful pricing table with 3 tiers
2. **app/components/SubscriptionManager.tsx** - Manage subscription UI
3. **app/components/UsageIndicator.tsx** - Usage meter component
4. **app/hooks/useSubscription.ts** - React hook for subscription data
5. **app/pricing/page.tsx** - Complete pricing page with FAQ

---

## 🚀 Next Steps to Get Started

### 1. Install Required Packages

```bash
npm install stripe @stripe/stripe-js
```

### 2. Set Up Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Get your API keys from [Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Create products and pricing in Stripe Dashboard

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get after setting up webhooks)

# Stripe Price IDs (create products first)
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migration

Go to Supabase Dashboard → SQL Editor and run `stripe_schema.sql`

### 5. Set Up Webhooks

For local development:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret to your `.env.local`

### 6. Test the Integration

```bash
npm run dev
```

Visit `http://localhost:3000/pricing` and test with card: **4242 4242 4242 4242**

---

## 📊 Pricing Tiers Implemented

### Free Tier
- **Price**: $0/month
- **Limit**: 1 analysis per month
- **Features**: Basic report access, community support

### Pro Tier
- **Price**: $29/month
- **Limit**: 10 analyses per month
- **Features**: Audio reports, mind maps, SWOT analysis, priority support

### Enterprise Tier
- **Price**: $99/month
- **Limit**: Unlimited analyses
- **Features**: All Pro features + custom integrations, dedicated support, API access

---

## 🔄 Integration Points

### Where to Add Subscription Checks

You'll want to add subscription checks in your existing analysis creation flow. Here's how:

#### In `app/api/initiate-analysis/route.ts` (or wherever you create analyses)

Add this at the beginning of your POST handler:

```typescript
import { checkUserCanCreateAnalysis, decrementAnalysisCount } from '@/lib/subscriptionCheck';

export async function POST(req: Request) {
  // Get user from auth token
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.substring(7); // Remove 'Bearer '
  
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user can create analysis
  const check = await checkUserCanCreateAnalysis(user.id);
  if (!check.canCreateAnalysis) {
    return NextResponse.json({ 
      error: 'Subscription limit reached',
      reason: check.reason,
      needsUpgrade: true
    }, { status: 403 });
  }

  // ... your existing analysis creation logic ...

  // After successful analysis creation, decrement count
  await decrementAnalysisCount(user.id);

  return NextResponse.json({ success: true, ... });
}
```

### In Your Dashboard/Frontend

Add the usage indicator to show remaining analyses:

```tsx
import UsageIndicator from '@/app/components/UsageIndicator';

export default function Dashboard() {
  return (
    <div>
      <UsageIndicator />
      {/* rest of your dashboard */}
    </div>
  );
}
```

Use the subscription hook to check access:

```tsx
import { useSubscription } from '@/app/hooks/useSubscription';

export default function CreateAnalysisButton() {
  const { canCreateAnalysis, needsUpgrade } = useSubscription();

  const handleClick = () => {
    if (!canCreateAnalysis()) {
      alert('Please upgrade your plan to create more analyses');
      window.location.href = '/pricing';
      return;
    }
    // Continue with analysis creation
  };

  return (
    <button onClick={handleClick}>
      {needsUpgrade() ? 'Upgrade to Create' : 'Create Analysis'}
    </button>
  );
}
```

---

## 🔐 Security Notes

✅ **Already Implemented:**
- RLS policies on all Stripe tables
- Webhook signature verification
- User authentication checks on all API routes
- Server-side subscription validation

⚠️ **Remember:**
- Never expose `STRIPE_SECRET_KEY` to the client
- Always verify webhooks with signature
- Validate user ownership before creating checkout sessions
- Use environment variables for all sensitive data

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

- [ ] Subscribe to Pro plan with test card
- [ ] Create analysis as Pro user (should decrement counter)
- [ ] Hit usage limit (should prompt upgrade)
- [ ] Upgrade from Pro to Enterprise
- [ ] Downgrade from Enterprise to Pro
- [ ] Cancel subscription (should revert to free tier)
- [ ] Subscription renewal (credits should reset)
- [ ] Failed payment (webhook should update status)
- [ ] Customer portal (update payment method, view invoices)
- [ ] One-time payment (if you implement pay-per-analysis)

---

## 📈 Monitoring & Analytics

### In Stripe Dashboard

- Monitor: Subscriptions, Revenue, Churn rate
- Check: Webhook delivery logs
- Review: Failed payments and dunning

### In Supabase

Query subscription data:

```sql
-- Active subscriptions by tier
SELECT 
  subscription_tier,
  COUNT(*) as count
FROM user_profiles
WHERE subscription_status = 'active'
GROUP BY subscription_tier;

-- Revenue this month
SELECT 
  SUM(amount) / 100.0 as revenue_usd
FROM payments
WHERE status = 'succeeded'
  AND created_at >= DATE_TRUNC('month', NOW());

-- Churn rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'canceled') * 100.0 / COUNT(*) as churn_rate
FROM subscriptions
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## 🎯 Customization Guide

### Change Pricing

Edit `lib/stripe.ts`:

```typescript
export const PRICING_TIERS = {
  PRO: {
    monthlyPrice: 49, // Change price
    analysesLimit: 20, // Change limit
    // ... rest
  },
};
```

Then create corresponding products in Stripe Dashboard.

### Add New Tier

1. Add to `PRICING_TIERS` in `lib/stripe.ts`
2. Create product in Stripe Dashboard
3. Add to `pricingTiers` array in `PricingTable.tsx`
4. Update `getTierFromPriceId()` in webhook handler

### Add Usage Tracking for Other Features

Use the same pattern as analyses:

```typescript
// In your API route
await supabaseAdmin
  .from('usage_records')
  .insert({
    user_id: userId,
    record_type: 'audio_report_generated', // New type
    quantity: 1,
  });
```

---

## 🚀 Production Deployment

### Pre-Launch Checklist

- [ ] Switch to live Stripe keys
- [ ] Create live products in Stripe
- [ ] Set up production webhook endpoint
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Test with real card (small amount)
- [ ] Set up Stripe Tax (if required)
- [ ] Configure email receipts in Stripe
- [ ] Add Terms of Service and Privacy Policy
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backup/monitoring for webhook events

### Deployment Steps

1. Push code to production
2. Add environment variables to hosting platform
3. Run database migration in production Supabase
4. Create webhook in Stripe Dashboard pointing to production URL
5. Test end-to-end with real payment
6. Monitor logs and webhooks for first few hours

---

## 📚 Additional Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Supabase + Stripe**: https://supabase.com/docs/guides/integrations/stripe
- **Stripe API Reference**: https://stripe.com/docs/api

---

## 💡 Feature Ideas for Future

1. **Annual billing** - Offer annual plans with discount
2. **Usage-based pricing** - Charge per analysis instead of subscription
3. **Team plans** - Multiple users per subscription
4. **Add-ons** - Buy extra analyses as needed
5. **Referral program** - Give credits for referrals
6. **Free trial** - 14-day trial for Pro tier
7. **Coupons** - Promotional discounts
8. **Metered billing** - Charge for API usage
9. **Invoice billing** - For enterprise customers
10. **Multiple payment methods** - Add PayPal, ACH, etc.

---

## ❓ FAQ

### How do I test webhooks locally?

Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### What if a webhook fails?

Stripe will retry failed webhooks automatically. Check the webhook logs in Stripe Dashboard.

### How do I handle refunds?

Process refunds in Stripe Dashboard. The webhook will update your database automatically.

### Can users change plans mid-cycle?

Yes! Stripe handles proration automatically. Users can upgrade/downgrade anytime via the customer portal.

### How do I prevent abuse?

- Rate limit API endpoints
- Validate user ownership
- Monitor usage patterns in Stripe Dashboard
- Set up alerts for unusual activity

---

**Need Help?** Check `STRIPE_QUICKSTART.md` for step-by-step setup instructions! 🎉
