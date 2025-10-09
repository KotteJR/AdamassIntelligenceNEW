-- SIMPLE STRIPE MIGRATION FOR PRODUCTION
-- Run this in Supabase SQL Editor (ONE TIME ONLY)

-- 1. Add subscription columns to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS analyses_remaining INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS analyses_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- 2. Create customers table (links users to Stripe customers)
CREATE TABLE IF NOT EXISTS customers (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service can manage customers" ON customers
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_stripe ON customers(stripe_customer_id);

-- 3. Create subscriptions table (tracks active subscriptions)
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

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage subscriptions" ON subscriptions
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 4. Function to check if user can create analysis
CREATE OR REPLACE FUNCTION can_create_analysis(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  remaining INTEGER;
  sub_status TEXT;
  sub_limit INTEGER;
BEGIN
  SELECT 
    analyses_remaining,
    subscription_status,
    analyses_limit
  INTO remaining, sub_status, sub_limit
  FROM user_profiles
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Unlimited (Enterprise) = -1 or 999999
  IF sub_limit = -1 OR sub_limit >= 999999 THEN
    RETURN TRUE;
  END IF;

  -- Check active subscription OR has remaining analyses
  RETURN (sub_status IN ('active', 'trialing') AND remaining > 0) OR remaining > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to decrement analysis count
CREATE OR REPLACE FUNCTION decrement_analysis_count(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET 
    analyses_remaining = GREATEST(0, analyses_remaining - 1),
    updated_at = NOW()
  WHERE id = user_uuid
    AND analyses_limit != -1  -- Don't decrement for unlimited plans
    AND analyses_limit < 999999;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to reset monthly analyses (for billing cycle)
CREATE OR REPLACE FUNCTION reset_monthly_analyses()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET 
    analyses_remaining = analyses_limit,
    subscription_period_start = NOW(),
    subscription_period_end = NOW() + INTERVAL '1 month'
  WHERE subscription_period_end < NOW()
    AND subscription_status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql;

-- 7. Initialize existing users with free tier
UPDATE user_profiles
SET 
  subscription_tier = 'free',
  subscription_status = 'none',
  analyses_remaining = 1,
  analyses_limit = 1,
  subscription_period_start = NOW(),
  subscription_period_end = NOW() + INTERVAL '1 month'
WHERE subscription_tier IS NULL OR subscription_tier = '';

-- Done! Your database is ready for Stripe integration.

