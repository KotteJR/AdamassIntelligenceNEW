-- Run this in Supabase SQL Editor to check if webhook updated your profile

-- Check your user profile
SELECT 
  email,
  subscription_tier,
  subscription_status,
  analyses_remaining,
  analyses_limit,
  stripe_customer_id,
  subscription_period_end
FROM user_profiles 
WHERE email = 'your@email.com'; -- Replace with your email

-- Check if customer was created
SELECT * FROM customers;

-- Check if subscription was created
SELECT * FROM subscriptions;

