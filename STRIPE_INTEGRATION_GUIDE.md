# Stripe Integration Guide for Adamass Intelligence

## Overview
This guide walks you through integrating Stripe payments with your Next.js + Supabase platform. The integration will:
- Connect Stripe customers with Supabase Auth users
- Handle subscription management
- Process one-time payments for analyses
- Manage webhooks for subscription updates
- Implement usage-based billing if needed

## Prerequisites
1. Stripe account ([stripe.com](https://stripe.com))
2. Stripe API keys (test and live)
3. Supabase project with admin access
4. Next.js application (already set up)

---

## Step 1: Install Stripe Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

---

## Step 2: Environment Variables

Add to your `.env.local`:

```bash
# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... # Use sk_live_... in production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Use pk_live_... in production

# Stripe Webhook Secret (Get after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...

# Your app URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Database Schema Updates

Run the SQL in `stripe_schema.sql` (provided separately) to add:
- `subscriptions` table - stores Stripe subscription data
- `customers` table - maps Supabase users to Stripe customers
- `payments` table - tracks one-time payments
- `usage_records` table - for usage-based billing (optional)

---

## Step 4: Create Stripe Products & Prices

In your Stripe Dashboard:

### For Subscription Model:
1. Go to Products → Create product
2. Create pricing tiers:
   - **Free Tier**: $0/month (or no product)
     - 1 analysis per month
   - **Pro Tier**: $29/month
     - 10 analyses per month
     - Audio reports included
   - **Enterprise Tier**: $99/month
     - Unlimited analyses
     - Priority support
     - Custom features

### For Pay-Per-Analysis Model:
1. Create a product: "Company Analysis"
2. Set price: $49 (one-time payment)

Save the price IDs (e.g., `price_xxx`) - you'll need them in your code.

---

## Step 5: Create Stripe Instance (Backend)

Create `lib/stripe.ts` for server-side Stripe operations.

---

## Step 6: Create Frontend Stripe Instance

Create `lib/stripe-client.ts` for client-side operations.

---

## Step 7: API Routes

You'll need these API routes:

### 7.1. Create Checkout Session
- `/api/stripe/create-checkout-session` - Initiates payment

### 7.2. Create Portal Session
- `/api/stripe/create-portal-session` - Let users manage subscriptions

### 7.3. Webhook Handler
- `/api/stripe/webhook` - Receives Stripe events

### 7.4. Get Subscription Status
- `/api/stripe/subscription-status` - Check user's current plan

---

## Step 8: Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to your `.env.local`

For local development, use Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Step 9: Implement Usage Tracking

Update your analysis creation logic to:
1. Check user's subscription/credits
2. Decrement usage counter
3. Prevent creation if limit exceeded

---

## Step 10: Frontend Components

Create these components:
- `PricingTable` - Display pricing tiers
- `SubscriptionButton` - Initiate checkout
- `SubscriptionManager` - View/manage current plan
- `UsageDisplay` - Show remaining credits/analyses

---

## Implementation Checklist

- [ ] Install Stripe packages
- [ ] Add environment variables
- [ ] Run database migrations
- [ ] Create products/prices in Stripe
- [ ] Implement server-side Stripe client
- [ ] Implement client-side Stripe client
- [ ] Create checkout session API
- [ ] Create portal session API
- [ ] Implement webhook handler
- [ ] Configure webhooks in Stripe Dashboard
- [ ] Add usage tracking to analysis creation
- [ ] Create pricing page/component
- [ ] Add subscription status checks
- [ ] Test in development with Stripe CLI
- [ ] Deploy and update webhook URL
- [ ] Switch to live keys in production

---

## Testing

### Test Cards (use in test mode):
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date and any CVC.

---

## Security Best Practices

1. ✅ Never expose `STRIPE_SECRET_KEY` to the client
2. ✅ Always verify webhook signatures
3. ✅ Validate user ownership before creating checkouts
4. ✅ Use Stripe's idempotency keys for retries
5. ✅ Implement proper error handling
6. ✅ Log all payment events for debugging
7. ✅ Use RLS policies to protect subscription data

---

## Common Integration Patterns

### Pattern 1: Subscription-Based (Recommended for SaaS)
- Users subscribe to monthly/annual plans
- Each plan has usage limits
- Automatic recurring billing
- Easy upgrades/downgrades

### Pattern 2: Pay-Per-Analysis
- Users buy credits or pay per analysis
- No recurring charges
- Good for infrequent users

### Pattern 3: Hybrid Model
- Free tier + paid tier subscriptions
- Option to buy additional credits
- Best of both worlds

For your business intelligence platform, I recommend **Pattern 1** with a hybrid option.

---

## Monitoring & Debugging

1. **Stripe Dashboard**: Monitor payments, subscriptions, customers
2. **Webhook Logs**: Check delivery status and responses
3. **Supabase Logs**: Monitor database operations
4. **Application Logs**: Track business logic errors

---

## Going Live

1. Replace test keys with live keys
2. Update webhook endpoint to production URL
3. Test with real payment methods (small amounts)
4. Monitor for any errors
5. Set up Stripe email notifications
6. Configure receipt/invoice settings
7. Add tax collection if required (Stripe Tax)

---

## Support Resources

- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Supabase Stripe Integration](https://supabase.com/docs/guides/integrations/stripe)
- [Next.js + Stripe Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)
