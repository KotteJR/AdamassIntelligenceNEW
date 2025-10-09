// Subscription and usage checking utilities
import { supabaseAdmin } from './supabaseAdmin';

export interface SubscriptionCheck {
  canCreateAnalysis: boolean;
  reason?: string;
  tier: string;
  analysesRemaining: number;
}

/**
 * Check if a user can create a new analysis based on their subscription
 */
export async function checkUserCanCreateAnalysis(userId: string): Promise<SubscriptionCheck> {
  try {
    // Get user profile with subscription info
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, analyses_remaining, analyses_limit')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return {
        canCreateAnalysis: false,
        reason: 'User profile not found',
        tier: 'none',
        analysesRemaining: 0,
      };
    }

    const tier = profile.subscription_tier || 'free';
    const status = profile.subscription_status || 'none';
    const remaining = profile.analyses_remaining || 0;
    const limit = profile.analyses_limit || 1;

    // Check if user has an active subscription or credits
    const hasActiveSubscription = ['active', 'trialing'].includes(status);
    const hasUnlimitedAnalyses = limit === 999999; // Enterprise tier
    const hasRemainingAnalyses = remaining > 0;

    if (hasActiveSubscription && hasUnlimitedAnalyses) {
      return {
        canCreateAnalysis: true,
        tier,
        analysesRemaining: -1, // unlimited
      };
    }

    if (hasActiveSubscription && hasRemainingAnalyses) {
      return {
        canCreateAnalysis: true,
        tier,
        analysesRemaining: remaining,
      };
    }

    if (!hasActiveSubscription && hasRemainingAnalyses) {
      // Free tier or one-time purchase credits
      return {
        canCreateAnalysis: true,
        tier,
        analysesRemaining: remaining,
      };
    }

    // No access
    return {
      canCreateAnalysis: false,
      reason: tier === 'free' 
        ? 'You have used all your free analyses this month. Please upgrade your plan or purchase additional analyses.'
        : 'Your subscription has expired or you have no remaining analyses. Please renew your subscription.',
      tier,
      analysesRemaining: 0,
    };
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return {
      canCreateAnalysis: false,
      reason: 'Error checking subscription status',
      tier: 'unknown',
      analysesRemaining: 0,
    };
  }
}

/**
 * Decrement the user's analysis count after successful creation
 */
export async function decrementAnalysisCount(userId: string): Promise<boolean> {
  try {
    // Get current count
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('analyses_remaining, analyses_limit')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.error('User profile not found for decrement');
      return false;
    }

    // Don't decrement if unlimited (enterprise)
    if (profile.analyses_limit === 999999) {
      return true;
    }

    // Decrement count
    const newCount = Math.max(0, (profile.analyses_remaining || 0) - 1);

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        analyses_remaining: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error decrementing analysis count:', error);
      return false;
    }

    // Record usage in usage_records table
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    await supabaseAdmin
      .from('usage_records')
      .insert({
        user_id: userId,
        subscription_id: subscription?.id || null,
        record_type: 'analysis_created',
        quantity: 1,
        metadata: {
          remaining_after: newCount,
        },
      });

    return true;
  } catch (error: any) {
    console.error('Error in decrementAnalysisCount:', error);
    return false;
  }
}

/**
 * Grant analysis credits to a user (for one-time purchases)
 */
export async function grantAnalysisCredits(userId: string, count: number = 1): Promise<boolean> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('analyses_remaining')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.error('User profile not found for granting credits');
      return false;
    }

    const newCount = (profile.analyses_remaining || 0) + count;

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        analyses_remaining: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error granting analysis credits:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Error in grantAnalysisCredits:', error);
    return false;
  }
}
