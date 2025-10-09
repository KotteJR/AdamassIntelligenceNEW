// Server-side Stripe instance
// Use this in API routes and server components only
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
  appInfo: {
    name: 'Adamass Intelligence',
    version: '1.0.0',
  },
});

// Stripe webhook signature verification
export function verifyStripeWebhook(
  rawBody: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }
}

// Helper to get or create Stripe customer for a user
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const { supabaseAdmin } = await import('./supabaseAdmin');
  
  // Check if customer already exists in our DB
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Store in our database
  await supabaseAdmin
    .from('customers')
    .insert({
      id: userId,
      stripe_customer_id: customer.id,
    });

  // Update user_profiles
  await supabaseAdmin
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

// Pricing tiers configuration
export const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    priceId: null, // No Stripe price for free tier
    monthlyPrice: 0,
    analysesLimit: 1,
    features: [
      '1 company analysis per month',
      'Basic report access',
      'Community support',
    ],
  },
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO, // Set this in your .env
    monthlyPrice: 29,
    analysesLimit: 10,
    features: [
      '10 company analyses per month',
      'Audio reports',
      'Mind map visualizations',
      'SWOT analysis',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE, // Set this in your .env
    monthlyPrice: 99,
    analysesLimit: -1, // -1 = unlimited
    features: [
      'Unlimited company analyses',
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'API access',
    ],
  },
} as const;

// One-time payment for single analysis
export const ONE_TIME_ANALYSIS_PRICE = {
  priceId: process.env.STRIPE_PRICE_ID_SINGLE_ANALYSIS,
  amount: 4900, // $49.00 in cents
  currency: 'usd',
  name: 'Single Company Analysis',
};
