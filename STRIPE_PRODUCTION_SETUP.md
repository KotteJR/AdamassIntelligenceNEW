# Stripe Production Setup Guide

## ✅ Step 1: Complete Stripe Account Verification

Before going live, you MUST complete Stripe's verification process:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click the banner that says "Activate your account"
3. Complete the business verification form:
   - Business details
   - Bank account information
   - Personal identification
   - Tax information

**⚠️ This can take 1-2 business days for approval**

---

## 🔑 Step 2: Get Live API Keys

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)
2. Go to **Developers** → **API keys**
3. Copy your **Live** keys:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

**⚠️ NEVER commit live secret keys to git!**

---

## 💰 Step 3: Create Live Products & Prices

### In Stripe Dashboard (Live Mode):

1. Go to **Products** → **Add product**

### Create Pro Plan:
- **Name**: Pro Plan
- **Description**: 10 analyses per month with advanced features
- **Pricing**: $29/month recurring
- **Copy the Price ID** (starts with `price_...`)

### Create Enterprise Plan:
- **Name**: Enterprise Plan
- **Description**: Unlimited analyses with all features
- **Pricing**: $99/month recurring
- **Copy the Price ID** (starts with `price_...`)

---

## 🔐 Step 4: Update Environment Variables

Update your `.env.local` file with LIVE credentials:

```bash
# Stripe LIVE Keys (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Live Price IDs
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_YOUR_LIVE_PRO_PRICE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_LIVE_ENTERPRISE_PRICE_ID

# Webhook Secret (Live) - You'll get this in Step 5
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# App URL (Your production domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🪝 Step 5: Configure Production Webhooks

### Option A: Using Stripe Dashboard (Recommended for Production)

1. In Stripe Dashboard (**Live mode**), go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Option B: Using Stripe CLI (For Testing Production Locally)

If you want to test production webhooks locally before deploying:

```bash
# Login to your live account
stripe login

# Forward live webhooks to your local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook --live
```

---

## 🚀 Step 6: Deploy to Production

1. **Update environment variables in your hosting platform** (Vercel, Netlify, etc.):
   - Add all the live keys from Step 4
   - Make sure `NEXT_PUBLIC_APP_URL` points to your production domain

2. **Deploy your app**:
   ```bash
   git add .
   git commit -m "Switch to Stripe production mode"
   git push origin main
   ```

3. **Verify deployment**:
   - Visit your production site
   - Test the pricing page loads
   - Check that buttons show correct prices

---

## ✅ Step 7: Test in Production

### Test with Real Card (Small Amount):

1. Go to your live site
2. Click "Subscribe" on the Pro plan
3. Use a REAL credit card (will charge actual money)
4. Test card for successful payment:
   - Any real card you own (will actually charge)
   
### Check Everything Works:

1. **Payment succeeds** ✓
2. **User redirected to /subscription** ✓
3. **Subscription shows "Pro" plan** ✓
4. **Webhook fires and updates database** ✓
5. **User can access pro features** ✓
6. **Cancel subscription works** ✓
7. **Customer portal works** ✓

---

## 🔄 Step 8: Database Migration (If Needed)

If you have test data in your database, you may want to:

```sql
-- Clear test subscription data (OPTIONAL - BE CAREFUL)
DELETE FROM user_subscriptions WHERE stripe_subscription_id LIKE 'sub_test_%';
DELETE FROM stripe_customers WHERE stripe_customer_id LIKE 'cus_test_%';
```

**⚠️ Only run this if you want to remove test data!**

---

## 📊 Step 9: Monitor Your Dashboard

After going live, regularly check:

1. **Stripe Dashboard** → Payments (for successful charges)
2. **Stripe Dashboard** → Customers (for new subscribers)
3. **Stripe Dashboard** → Subscriptions (for active subscriptions)
4. **Your database** (check `user_subscriptions` table)
5. **Webhook logs** in Stripe Dashboard

---

## 🎯 Quick Checklist

- [ ] Stripe account fully verified
- [ ] Live API keys obtained
- [ ] Live products created in Stripe
- [ ] Price IDs copied
- [ ] Environment variables updated
- [ ] Production webhook configured
- [ ] App deployed to production
- [ ] Test payment completed successfully
- [ ] Subscription shows in dashboard
- [ ] Features work based on tier
- [ ] Upgrade/downgrade works
- [ ] Portal access works

---

## 🆘 Common Issues

### Issue: "Your account is not activated"
**Solution**: Complete Stripe account verification in dashboard

### Issue: Webhook not firing
**Solution**: 
- Check webhook URL is correct in Stripe dashboard
- Verify `STRIPE_WEBHOOK_SECRET` matches in `.env`
- Check webhook logs in Stripe dashboard for errors

### Issue: Subscription not showing after payment
**Solution**:
- Check webhook is configured correctly
- Look at webhook logs in Stripe dashboard
- Check your API route logs: `app/api/stripe/webhook/route.ts`

### Issue: Using test keys in production
**Solution**: Make sure all keys start with `pk_live_` and `sk_live_` (not `pk_test_`)

---

## 💡 Best Practices

1. **Keep test and live separate**: Never mix test and live keys
2. **Monitor webhooks**: Set up alerts for failed webhooks
3. **Test thoroughly**: Do a real subscription test before announcing
4. **Have a refund policy**: Be clear about refunds and cancellations
5. **Customer support**: Have a way for users to contact you about billing issues

---

## 📞 Need Help?

- Stripe Support: https://support.stripe.com
- Stripe Docs: https://stripe.com/docs
- Your webhook logs: https://dashboard.stripe.com/webhooks

---

**Ready to go live! 🚀**

