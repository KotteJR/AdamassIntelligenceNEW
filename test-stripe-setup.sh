#!/bin/bash

echo "🧪 Stripe Test Mode Setup Checker"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "   Create it with your Stripe test keys"
    exit 1
fi

echo "✅ .env.local file found"

# Check for required environment variables
required_vars=(
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "STRIPE_PRICE_ID_PRO"
    "STRIPE_PRICE_ID_ENTERPRISE"
)

missing=0
for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env.local; then
        value=$(grep "^$var=" .env.local | cut -d'=' -f2)
        if [ "$value" = "your_test_key_here" ] || [ "$value" = "sk_test_YOUR_KEY" ] || [ -z "$value" ]; then
            echo "⚠️  $var is not set properly"
            missing=1
        else
            echo "✅ $var is set"
        fi
    else
        echo "❌ $var is missing"
        missing=1
    fi
done

echo ""

if [ $missing -eq 1 ]; then
    echo "❌ Some environment variables are missing or not configured"
    echo ""
    echo "📝 Setup Instructions:"
    echo "1. Go to https://dashboard.stripe.com (Test mode)"
    echo "2. Create test products and get Price IDs"
    echo "3. Get API keys from Developers → API keys"
    echo "4. Update .env.local with real values"
    echo ""
    echo "See TEST_MODE_SETUP.md for detailed instructions"
    exit 1
fi

echo ""
echo "✅ All Stripe environment variables are configured!"
echo ""
echo "Next steps:"
echo "1. Run database migration (stripe_migration_simple.sql)"
echo "2. Start dev server: npm run dev"
echo "3. Start Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo "4. Test at http://localhost:3000/pricing"
echo ""
echo "Test card: 4242 4242 4242 4242"

