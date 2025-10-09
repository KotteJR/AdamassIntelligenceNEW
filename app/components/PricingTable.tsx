'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeToggle';
import { useUser } from '../contexts/UserContext';

interface PricingTier {
  name: string;
  price: number;
  priceId: string | null;
  analysesLimit: number;
  features: string[];
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    analysesLimit: 1,
    features: [
      '1 company analysis per month',
      'Basic report access',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
    analysesLimit: 10,
    popular: true,
    features: [
      '10 company analyses per month',
      'Audio reports',
      'Mind map visualizations',
      'SWOT analysis',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || '',
    analysesLimit: -1,
    features: [
      'Unlimited company analyses',
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'API access',
    ],
  },
];

export default function PricingTable() {
  const { isDark } = useTheme();
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchCurrentTier = async () => {
      if (!user) return;
      
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        const response = await fetch('/api/stripe/subscription-status', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentTier(data.tier || 'free');
          setHasActiveSubscription(data.hasStripeCustomer && data.tier !== 'free');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };

    fetchCurrentTier();
  }, [user]);

  const handleSubscribe = async (priceId: string | null, tierName: string, isUpgradeOrDowngrade: boolean) => {
    if (!priceId) {
      alert('Sign up to get started with the free tier!');
      return;
    }

    setLoading(tierName);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert('Please sign in first');
        setLoading(null);
        return;
      }

      // If user has active subscription and is upgrading/downgrading, update existing subscription
      if (hasActiveSubscription && isUpgradeOrDowngrade) {
        const response = await fetch('/api/stripe/update-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ priceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update subscription');
        }

        // Refresh the page to show updated subscription
        window.location.href = '/subscription?updated=true';
      } else {
        // New subscription - use checkout session
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            priceId,
            mode: 'subscription',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to process subscription');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8 md:mt-10">
        <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
          Pricing Plans
        </h2>
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
          Choose Your Plan
        </h1>
        <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
          Select the perfect plan for your business intelligence needs
        </p>
      </div>

      {error && (
        <div className={`mb-6 p-3 rounded-xl border text-sm ${
          isDark
            ? 'theme-card theme-border text-red-400'
            : 'bg-white border-slate-200 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {pricingTiers.map((tier) => {
          const isCurrentPlan = tier.name.toLowerCase() === currentTier.toLowerCase();
          
          // Determine tier hierarchy
          const tierLevels: { [key: string]: number } = { free: 0, pro: 1, enterprise: 2 };
          const currentLevel = tierLevels[currentTier.toLowerCase()] || 0;
          const tierLevel = tierLevels[tier.name.toLowerCase()] || 0;
          const isUpgrade = tierLevel > currentLevel && currentLevel > 0; // Only upgrade if not on free
          const isDowngrade = tierLevel < currentLevel && !isCurrentPlan;
          
          // Determine button text
          let buttonText = 'Subscribe';
          if (isCurrentPlan) {
            buttonText = 'Current Plan';
          } else if (isDowngrade) {
            buttonText = 'Downgrade';
          } else if (isUpgrade) {
            buttonText = 'Upgrade';
          }
          
          return (
          <div
            key={tier.name}
            className={`rounded-xl border p-6 flex flex-col ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  {tier.name}
                </h3>
                {isCurrentPlan ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isDark ? 'bg-green-900/50 border border-green-400 text-green-200' : 'bg-green-50 border border-green-400 text-green-800'
                  }`}>
                    Current Plan
                  </span>
                ) : tier.popular && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isDark ? 'theme-muted theme-text' : 'bg-slate-100 text-slate-900'
                  }`}>
                    
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline mb-1">
                <span className={`text-4xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  ${tier.price}
                </span>
                <span className={`ml-2 text-sm ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                  /month
                </span>
              </div>
              
              <p className={`text-xs ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                {tier.analysesLimit === -1
                  ? 'Unlimited analyses'
                  : `${tier.analysesLimit} ${tier.analysesLimit === 1 ? 'analysis' : 'analyses'} per month`
                }
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6 flex-grow">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                    •
                  </span>
                  <span className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => handleSubscribe(tier.priceId, tier.name, isUpgrade || isDowngrade)}
              disabled={loading === tier.name || isCurrentPlan}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrentPlan
                  ? `${isDark ? 'theme-muted theme-text-muted' : 'bg-slate-100 text-slate-500'} cursor-not-allowed`
                  : isUpgrade
                  ? `${isDark ? 'bg-green-900/50 border border-green-400 text-green-200 hover:bg-green-900/70' : 'bg-green-50 border border-green-400 text-green-800 hover:bg-green-100'}`
                  : isDowngrade
                  ? `${isDark ? 'bg-red-900/50 border border-red-400 text-red-200 hover:bg-red-900/70' : 'bg-red-50 border border-red-400 text-red-800 hover:bg-red-100'}`
                  : `${isDark ? 'theme-muted theme-text hover:opacity-80' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === tier.name ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                buttonText
              )}
            </button>
          </div>
          );
        })}
      </div>

    </div>
  );
}
