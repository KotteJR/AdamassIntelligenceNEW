# 💳 Stripe Integration for Adamass Intelligence

## What You Now Have

I've created a **complete, production-ready Stripe integration** for your platform with subscription management, usage tracking, and payment processing. Everything is set up and ready to use once you follow the setup steps.

---

## 📦 Files Created

### 📖 Documentation (4 files)
- **STRIPE_INTEGRATION_GUIDE.md** - Comprehensive overview and concepts
- **STRIPE_QUICKSTART.md** - Step-by-step setup guide (START HERE!)
- **INTEGRATION_EXAMPLE.md** - Code examples for your existing routes
- **STRIPE_IMPLEMENTATION_SUMMARY.md** - Complete implementation details
- **README_STRIPE.md** - This file (overview)

### 🗄️ Database (1 file)
- **stripe_schema.sql** - Complete database schema with:
  - `customers` table (links users to Stripe)
  - `subscriptions` table (tracks subscriptions)
  - `payments` table (one-time payments)
  - `usage_records` table (usage tracking)
  - Helper functions for subscription checks
  - RLS policies for security

### ⚙️ Backend Code (7 files)
- **lib/stripe.ts** - Server-side Stripe client
- **lib/stripe-client.ts** - Client-side utilities
- **lib/subscriptionCheck.ts** - Subscription validation logic
- **app/api/stripe/create-checkout-session/route.ts** - Start checkout
- **app/api/stripe/create-portal-session/route.ts** - Manage subscriptions
- **app/api/stripe/webhook/route.ts** - Handle Stripe events
- **app/api/stripe/subscription-status/route.ts** - Get user's plan

### 🎨 Frontend Components (5 files)
- **app/components/PricingTable.tsx** - Beautiful pricing page
- **app/components/SubscriptionManager.tsx** - Subscription management UI
- **app/components/UsageIndicator.tsx** - Usage meter widget
- **app/hooks/useSubscription.ts** - React hook for subscription data
- **app/pricing/page.tsx** - Complete pricing page with FAQ

### 📋 Configuration (1 file)
- **.env.example** - All required environment variables

---

## 🚀 Quick Start (3 Steps)

### 1. Install Packages
```bash
npm install stripe @stripe/stripe-js
```

### 2. Set Up Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Create products (Pro: $29/mo, Enterprise: $99/mo)
3. Copy API keys and price IDs

### 3. Configure Environment
Create `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

### 4. Run Database Migration
Copy `stripe_schema.sql` into Supabase SQL Editor and run it.

### 5. Test It!
```bash
npm run dev
```
Visit `http://localhost:3000/pricing`

**📘 For detailed step-by-step instructions, see `STRIPE_QUICKSTART.md`**

---

## 💰 Pricing Tiers Configured

| Tier | Price | Analyses/Month | Features |
|------|-------|----------------|----------|
| **Free** | $0 | 1 | Basic reports |
| **Pro** | $29 | 10 | Audio, Mind Maps, SWOT, Priority Support |
| **Enterprise** | $99 | Unlimited | Everything + API, Dedicated Support |

---

## 🔗 Integration with Your Platform

Your platform already has:
- ✅ Supabase authentication
- ✅ User profiles
- ✅ Analysis creation workflow

Now you need to add subscription checks to your analysis creation. Here's the minimal change:

### In `app/api/initiate-analysis/route.ts`

Add these 3 blocks:

```typescript
// 1. At the top - import the subscription checker
import { checkUserCanCreateAnalysis, decrementAnalysisCount } from '@/lib/subscriptionCheck';

// 2. Before creating analysis - check subscription
const check = await checkUserCanCreateAnalysis(user.id);
if (!check.canCreateAnalysis) {
  return NextResponse.json({ 
    error: 'Subscription limit reached',
    needsUpgrade: true 
  }, { status: 403 });
}

// 3. After successful creation - decrement counter
await decrementAnalysisCount(user.id);
```

**📘 For complete code examples, see `INTEGRATION_EXAMPLE.md`**

---

## 🎯 What This Gives You

### For Users
✅ Subscribe to monthly plans  
✅ Manage subscription (upgrade/downgrade/cancel)  
✅ See remaining analyses  
✅ Secure payment with Stripe  
✅ Automatic billing and receipts  

### For You (Business)
✅ Recurring revenue  
✅ Automatic payment processing  
✅ Usage tracking and analytics  
✅ Customer management  
✅ Webhook automation  
✅ Dunning (failed payment recovery)  

### Technical Benefits
✅ Secure by default (RLS policies)  
✅ Production-ready code  
✅ Error handling  
✅ Webhook verification  
✅ Test mode included  

---

## 📊 User Flow

```
1. User signs up (existing Supabase auth)
2. User gets 1 free analysis
3. User uses free analysis
4. User tries to create another → Prompted to upgrade
5. User clicks "Subscribe to Pro"
6. Redirected to Stripe Checkout
7. Enters payment details
8. Webhook fires → Database updated
9. User now has 10 analyses/month
10. User creates analysis → Counter decrements
```

---

## 🧪 Testing

Use Stripe test card: **4242 4242 4242 4242**

Test these scenarios:
1. ✅ Subscribe to Pro plan
2. ✅ Create analysis (counter decrements)
3. ✅ Hit limit (upgrade prompt)
4. ✅ Upgrade to Enterprise
5. ✅ Cancel subscription
6. ✅ Manage subscription in portal

---

## 🔐 Security

✅ **Webhook signature verification** - Prevents fake webhooks  
✅ **RLS policies** - Users can only see their own data  
✅ **Auth checks** - All routes require authentication  
✅ **Server-side validation** - Subscription checks on backend  
✅ **No exposed secrets** - All keys in env variables  

---

## 📈 Going to Production

When ready to accept real payments:

1. Switch to live Stripe keys
2. Create live products in Stripe
3. Update webhook to production URL
4. Test with real card (small amount)
5. Deploy!

**📘 See `STRIPE_IMPLEMENTATION_SUMMARY.md` for full production checklist**

---

## 🛠️ Customization

### Change Pricing
Edit `lib/stripe.ts`:
```typescript
PRO: {
  monthlyPrice: 39, // Change from 29 to 39
  analysesLimit: 20, // Change from 10 to 20
}
```

### Add New Features
- **Annual billing** - Create yearly price in Stripe
- **Add-ons** - One-time analysis purchases
- **Team plans** - Multiple users per subscription
- **Coupons** - Promotional discounts

---

## 📚 Documentation Structure

Start here → **STRIPE_QUICKSTART.md** (30-minute setup)

Need details? → **STRIPE_INTEGRATION_GUIDE.md** (concepts & architecture)

Integrating with existing code? → **INTEGRATION_EXAMPLE.md** (code examples)

Production checklist? → **STRIPE_IMPLEMENTATION_SUMMARY.md** (deployment guide)

---

## 🆘 Common Issues

### "Cannot find module '@stripe/stripe-js'"
→ Run `npm install stripe @stripe/stripe-js`

### "Missing STRIPE_SECRET_KEY"
→ Add to `.env.local` and restart dev server

### Webhooks not working
→ Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Database permission errors
→ Make sure you ran the complete `stripe_schema.sql`

---

## 💡 Next Steps

1. **Read** `STRIPE_QUICKSTART.md` (15 min)
2. **Install** packages and set up Stripe account (10 min)
3. **Run** database migration (2 min)
4. **Test** checkout flow (5 min)
5. **Integrate** with your analysis route (10 min)
6. **Launch** and start earning! 🚀

---

## 📞 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Supabase + Stripe Guide](https://supabase.com/docs/guides/integrations/stripe)
- [Test Cards](https://stripe.com/docs/testing)

---

## ✨ Features Included

- ✅ Subscription management
- ✅ Usage tracking
- ✅ Beautiful pricing page
- ✅ Customer portal
- ✅ Webhook handling
- ✅ Free tier support
- ✅ Usage limits
- ✅ Pro & Enterprise tiers
- ✅ Automatic renewals
- ✅ Cancellation handling
- ✅ Failed payment recovery
- ✅ Proration on upgrades/downgrades
- ✅ Usage analytics
- ✅ Security (RLS, auth)
- ✅ Test mode
- ✅ Production ready

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just follow the quick start steps and you'll have a fully functional payment system in under 30 minutes.

**Start with: `STRIPE_QUICKSTART.md`**

Good luck! 🚀
