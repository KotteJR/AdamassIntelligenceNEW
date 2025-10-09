'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeToggle';

interface SubscriptionStatus {
  tier: string;
  status: string;
  analysesRemaining: number;
  analysesLimit: number;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
  subscription: any;
}

export default function SubscriptionManager() {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      // Import supabase at the top of the file
      const { supabase } = await import('../../lib/supabaseClient');
      
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
        throw new Error(data.error || 'Failed to fetch subscription status');
      }

      setStatus(data);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Portal error:', err);
      setError(err.message);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${
          isDark ? 'border-slate-600 border-t-[color:var(--accent)]' : 'border-slate-300 border-t-slate-600'
        }`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border ${
        isDark 
          ? 'bg-red-900/20 border-red-800 text-red-400' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        {error}
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`p-4 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
        No subscription information available
      </div>
    );
  }

  const usagePercentage = status.analysesLimit > 0
    ? (status.analysesRemaining / status.analysesLimit) * 100
    : 0;

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
      <div className="space-y-6">
        {/* Current Plan */}
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
            {status.tier === 'free' ? '🆓 Free Plan' : status.tier === 'pro' ? 'Adamass Pro' : 'Adamass Enterprise'}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
            {status.tier === 'free' ? 'Basic features' : status.tier === 'pro' ? 'All Pro features included' : 'Unlimited access'}
          </p>
        </div>

        {/* Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
              Analyses Remaining
            </label>
            <span className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
              {status.analysesRemaining} / {status.analysesLimit === 999999 ? '∞' : status.analysesLimit}
            </span>
          </div>
          
          {status.analysesLimit !== 999999 && (
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercentage > 50 
                    ? 'bg-green-500' 
                    : usagePercentage > 20 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(usagePercentage, 2)}%` }}
              />
            </div>
          )}

          {status.analysesRemaining === 0 && status.tier === 'free' && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              You've used all your free analyses this month. Upgrade to continue!
            </p>
          )}
        </div>

        {/* Billing Period */}
        {status.periodEnd && (
          <div>
            <label className={`text-sm mb-1 block ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
              Current Period Ends
            </label>
            <p className={`font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>
              {new Date(status.periodEnd).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`pt-4 border-t ${isDark ? 'theme-border' : 'border-slate-200'}`}>
          {status.hasStripeCustomer && status.tier !== 'free' ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'theme-muted theme-text hover:opacity-80' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          ) : status.tier === 'free' && (
            <a
              href="/pricing"
              className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'btn-primary' 
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              Upgrade Plan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
