import { NextRequest, NextResponse } from 'next/server';
import { stripe, verifyStripeWebhook } from '@lib/stripe';
import { supabaseAdmin } from '@lib/supabaseAdmin';
import Stripe from 'stripe';

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = verifyStripeWebhook(body, signature);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle checkout session completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  
  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  if (session.mode === 'payment') {
    // One-time payment
    const paymentIntent = session.payment_intent as string;
    
    await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        status: 'succeeded',
        description: 'Single analysis purchase',
        metadata: session.metadata,
      });

    // Grant one analysis credit
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('analyses_remaining')
      .eq('id', userId)
      .single();

    await supabaseAdmin
      .from('user_profiles')
      .update({
        analyses_remaining: (profile?.analyses_remaining || 0) + 1,
      })
      .eq('id', userId);
  } else if (session.mode === 'subscription') {
    // Subscription will be handled by subscription.created webhook
    console.log('Subscription created via checkout, will be handled by subscription webhook');
  }
}

// Handle subscription creation/update
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('=== HANDLING SUBSCRIPTION UPDATE ===');
  console.log('Subscription ID:', subscription.id);
  console.log('Customer ID:', subscription.customer);
  console.log('Status:', subscription.status);
  
  const userId = subscription.metadata?.user_id;
  const customerId = subscription.customer as string;

  if (!userId) {
    console.log('No user_id in metadata, looking up by customer_id...');
    // Try to get user_id from customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!customer) {
      console.error('❌ No user found for subscription');
      return;
    }
    console.log('✅ Found user from customer:', customer.id);
  }

  const finalUserId = userId || (await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()
  ).data?.id;

  if (!finalUserId) {
    console.error('❌ Could not determine user ID for subscription');
    return;
  }

  console.log('Using user ID:', finalUserId);

  // Upsert subscription
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: finalUserId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id,
      quantity: subscription.items.data[0]?.quantity || 1,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString() 
        : null,
      current_period_end: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
    });

  if (subError) {
    console.error('❌ Error upserting subscription:', subError);
  } else {
    console.log('✅ Subscription upserted successfully');
  }

  // Update user profile with subscription status
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);
  const analysesLimit = getAnalysesLimitForTier(tier);

  console.log('Price ID:', priceId);
  console.log('Determined tier:', tier);
  console.log('Analyses limit:', analysesLimit);

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      analyses_limit: analysesLimit,
      analyses_remaining: analysesLimit,
      subscription_period_end: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
      subscription_period_start: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString() 
        : null,
    })
    .eq('id', finalUserId);

  if (profileError) {
    console.error('❌ Error updating user profile:', profileError);
  } else {
    console.log('✅ User profile updated successfully!');
    console.log(`User ${finalUserId} is now on ${tier} tier with ${analysesLimit} analyses`);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  // Get user ID
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscription.id)
    .single();

  if (sub?.user_id) {
    // Revert to free tier
    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        analyses_limit: 1,
        analyses_remaining: 1,
      })
      .eq('id', sub.user_id);
  }
}

// Handle successful invoice payment
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  // Reset usage/credits for the new billing period
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, price_id')
    .eq('id', subscriptionId)
    .single();

  if (subscription) {
    const tier = getTierFromPriceId(subscription.price_id);
    const analysesLimit = getAnalysesLimitForTier(tier);

    await supabaseAdmin
      .from('user_profiles')
      .update({
        analyses_remaining: analysesLimit,
        subscription_status: 'active',
      })
      .eq('id', subscription.user_id);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscriptionId)
    .single();

  if (subscription) {
    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
      })
      .eq('id', subscription.user_id);
  }

  // TODO: Send email notification to user about failed payment
}

// Helper functions
function getTierFromPriceId(priceId: string): string {
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
  const enterprisePriceId = process.env.STRIPE_PRICE_ID_ENTERPRISE;

  if (priceId === proPriceId) return 'pro';
  if (priceId === enterprisePriceId) return 'enterprise';
  return 'free';
}

function getAnalysesLimitForTier(tier: string): number {
  switch (tier) {
    case 'pro':
      return 10;
    case 'enterprise':
      return 999999; // Effectively unlimited
    default:
      return 1;
  }
}
