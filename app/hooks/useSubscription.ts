'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface SubscriptionData {
  tier: string;
  status: string;
  analysesRemaining: number;
  analysesLimit: number;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
  subscription: any;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // Get the session token from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/stripe/subscription-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      setSubscription(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const canCreateAnalysis = (): boolean => {
    if (!subscription) return false;
    
    const hasActiveSubscription = ['active', 'trialing'].includes(subscription.status);
    const hasUnlimited = subscription.analysesLimit === 999999;
    const hasCredits = subscription.analysesRemaining > 0;

    return hasActiveSubscription && (hasUnlimited || hasCredits) || hasCredits;
  };

  const needsUpgrade = (): boolean => {
    if (!subscription) return true;
    return subscription.analysesRemaining === 0 && subscription.tier === 'free';
  };

  const isEnterprise = (): boolean => {
    return subscription?.tier === 'enterprise';
  };

  const isPro = (): boolean => {
    return subscription?.tier === 'pro';
  };

  const isFree = (): boolean => {
    return subscription?.tier === 'free' || !subscription?.tier;
  };

  return {
    subscription,
    loading,
    error,
    canCreateAnalysis,
    needsUpgrade,
    isEnterprise,
    isPro,
    isFree,
    refetch: fetchSubscription,
  };
}
