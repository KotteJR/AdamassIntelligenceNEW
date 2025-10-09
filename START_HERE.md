# 🎯 START HERE - Test Stripe in 5 Steps

## What You're Setting Up

You're adding subscription payments (Pro $29/mo, Enterprise $99/mo) to your app. Users start with FREE (1 analysis), then can upgrade for more.

---

## Step 1: Create Test Products in Stripe (3 min)

1. **Go to**: https://dashboard.stripe.com
2. **Switch to Test Mode** (toggle at top right - should say "Test mode")
3. **Click**: Products → Add product

### Product #1: Pro
- Name: `Pro Plan`
- Price: `$29.00`
- Recurring: `Monthly`
- Click "Add product"
- **COPY** the Price ID (looks like `price_1Abc123...`)

### Product #2: Enterprise  
- Name: `Enterprise Plan`
- Price: `$99.00`
- Recurring: `Monthly`
- Click "Add product"
- **COPY** the Price ID

✅ You now have 2 price IDs. Save them!

---

## Step 2: Get API Keys (1 min)

1. Go to: **Developers** → **API keys**
2. Make sure it says "Viewing test data"
3. **COPY** these 2 keys:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...` (click Reveal)

✅ You now have 4 things copied (2 price IDs + 2 API keys)

---

## Step 3: Setup Webhook (2 min)

### Install Stripe CLI:

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows/Linux:**
Download from: https://github.com/stripe/stripe-cli/releases

### Run Stripe CLI:
```bash
# Login
stripe login

# Start listening (keep this running!)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This shows: `whsec_...` ← **COPY THIS!**

✅ Keep this terminal open while testing

---

## Step 4: Add Keys to Your Project (1 min)

1. **Copy** `env.test.example` to `.env.local`
2. **Fill in** your keys:

```bash
# Add your Stripe TEST keys:
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE  
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Add your Price IDs:
STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_PRO_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ENTERPRISE_ID
```

✅ Your app can now talk to Stripe!

---

## Step 5: Setup Database (1 min)

1. Go to **Supabase Dashboard** → SQL Editor
2. Copy everything from `stripe_migration_simple.sql`
3. Click **Run**

✅ Database ready!

---

## 🚀 Test It!

### Start your app:
```bash
npm run dev
```

### Test the flow:
1. Go to: http://localhost:3000
2. Sign in (or create account)
3. Click "Pricing" in header
4. Click "Subscribe" on Pro plan
5. Use test card: **4242 4242 4242 4242**
   - Date: 12/25
   - CVC: 123
6. Complete checkout
7. Go to: http://localhost:3000/subscription
8. You should see: **Pro subscription, 10 analyses remaining!** 🎉

---

## ✅ How to Verify It Worked

### Check 1: Your App
- `/subscription` page shows Pro plan
- Shows 10 analyses remaining

### Check 2: Stripe Dashboard  
- Go to: https://dashboard.stripe.com/test/customers
- You should see your test customer
- Click on them → see active subscription

### Check 3: Stripe CLI Terminal
- Should show webhook events being sent
- Look for: `customer.subscription.created` ✓

### Check 4: Database
```sql
SELECT email, subscription_tier, analyses_remaining 
FROM user_profiles 
WHERE email = 'your@email.com';

-- Should show:
-- subscription_tier: 'pro'
-- analyses_remaining: 10
```

---

## 🐛 Troubleshooting

### Issue: "Module not found" error
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: Webhook not working
- Is Stripe CLI running? Check the terminal
- Does webhook secret in `.env.local` match CLI output?

### Issue: Not getting access after payment
1. Check Stripe CLI terminal - see events?
2. Check server logs - any errors?
3. Check Supabase - did user_profiles update?

### Issue: Can't see pricing page
- Clear cache: `rm -rf .next`
- Restart: `npm run dev`

---

## 📊 Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 9995 | ❌ Fails |
| 4000 0027 6000 3184 | 🔒 Requires 3D Secure |

---

## 🎉 Success! What Now?

Once test mode works:

- ✅ Test canceling subscription (go to `/subscription` → Manage)
- ✅ Test failed payment card
- ✅ Verify analysis limits work
- 🚀 Ready for production? Follow `QUICK_START.md` to use LIVE keys

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Start Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Check setup
./test-stripe-setup.sh

# View logs
# Server: terminal running npm run dev
# Webhooks: terminal running stripe listen
```

---

## Need Help?

**Check these files:**
- `TEST_MODE_SETUP.md` - Detailed test setup
- `QUICK_START.md` - Production setup
- `stripe_migration_simple.sql` - Database schema

**Common Issues:**
1. Wrong Stripe mode? Check toggle says "Test mode"
2. Webhook secret mismatch? Copy from Stripe CLI output
3. Price IDs wrong? Check Stripe Dashboard → Products
4. Database not setup? Run `stripe_migration_simple.sql`

**Everything working?** 🎊 You're ready to accept payments!

**Test card**: `4242 4242 4242 4242`

