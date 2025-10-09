#!/bin/bash

# Production Readiness Checker for Stripe Integration
# Run this script to verify you're ready to go live

echo "🔍 Checking Stripe Production Readiness..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Source the env file
export $(cat .env.local | grep -v '^#' | xargs)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. STRIPE API KEYS CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check publishable key
if [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
    echo -e "${GREEN}✓${NC} Publishable key is LIVE (pk_live_...)"
elif [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_test_* ]]; then
    echo -e "${YELLOW}⚠${NC} Publishable key is TEST (pk_test_...)"
    echo "  → Switch to live keys to go production"
else
    echo -e "${RED}✗${NC} Publishable key not found or invalid"
fi

# Check secret key
if [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
    echo -e "${GREEN}✓${NC} Secret key is LIVE (sk_live_...)"
elif [[ $STRIPE_SECRET_KEY == sk_test_* ]]; then
    echo -e "${YELLOW}⚠${NC} Secret key is TEST (sk_test_...)"
    echo "  → Switch to live keys to go production"
else
    echo -e "${RED}✗${NC} Secret key not found or invalid"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2. PRICE IDs CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Pro price ID
if [[ $NEXT_PUBLIC_STRIPE_PRICE_ID_PRO == price_* ]]; then
    echo -e "${GREEN}✓${NC} Pro Plan price ID configured"
else
    echo -e "${RED}✗${NC} Pro Plan price ID not found"
fi

# Check Enterprise price ID
if [[ $NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE == price_* ]]; then
    echo -e "${GREEN}✓${NC} Enterprise Plan price ID configured"
else
    echo -e "${RED}✗${NC} Enterprise Plan price ID not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3. WEBHOOK SECRET CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
    echo -e "${GREEN}✓${NC} Webhook secret configured"
else
    echo -e "${RED}✗${NC} Webhook secret not found"
    echo "  → Configure webhook in Stripe Dashboard"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4. APP URL CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $NEXT_PUBLIC_APP_URL == https://* ]]; then
    echo -e "${GREEN}✓${NC} App URL is HTTPS: $NEXT_PUBLIC_APP_URL"
elif [[ $NEXT_PUBLIC_APP_URL == http://localhost* ]]; then
    echo -e "${YELLOW}⚠${NC} App URL is localhost"
    echo "  → Update to production URL before deploying"
else
    echo -e "${RED}✗${NC} App URL not found or invalid"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  5. REQUIRED FILES CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

files=(
    "app/api/stripe/create-checkout-session/route.ts"
    "app/api/stripe/create-portal-session/route.ts"
    "app/api/stripe/webhook/route.ts"
    "app/api/stripe/subscription-status/route.ts"
    "app/components/PricingTable.tsx"
    "app/components/SubscriptionManager.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY == pk_live_* ]] && \
   [[ $STRIPE_SECRET_KEY == sk_live_* ]] && \
   [[ $NEXT_PUBLIC_STRIPE_PRICE_ID_PRO == price_* ]] && \
   [[ $NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE == price_* ]] && \
   [[ $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
    echo -e "${GREEN}✓ Ready for production!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Complete Stripe account verification"
    echo "2. Deploy to production"
    echo "3. Configure webhook in Stripe Dashboard"
    echo "4. Test with real payment"
else
    echo -e "${YELLOW}⚠ Not ready for production${NC}"
    echo ""
    echo "Please complete the following:"
    echo "1. Switch to live Stripe keys"
    echo "2. Create live products in Stripe Dashboard"
    echo "3. Configure webhook secret"
    echo "4. Update app URL to production domain"
    echo ""
    echo "See STRIPE_PRODUCTION_SETUP.md for detailed instructions"
fi

echo ""

