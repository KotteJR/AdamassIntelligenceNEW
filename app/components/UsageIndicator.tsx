'use client';

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from './ThemeToggle';

export default function UsageIndicator() {
  const { subscription, loading } = useSubscription();
  const { isDark } = useTheme();

  if (loading || !subscription) {
    return null;
  }

  const { analysesRemaining, analysesLimit, tier } = subscription;
  const isUnlimited = analysesLimit === 999999;
  const percentage = isUnlimited ? 100 : (analysesRemaining / analysesLimit) * 100;
  const isLow = percentage < 25 && !isUnlimited;

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
            {tier === 'free' ? '🆓 Free' : tier === 'pro' ? '⭐ Pro' : '💎 Enterprise'}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
            {isUnlimited ? 'Unlimited analyses' : `${analysesRemaining} of ${analysesLimit} remaining`}
          </p>
        </div>
        
        {!isUnlimited && (
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              isLow 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-green-500 dark:text-green-400'
            }`}>
              {analysesRemaining}
            </p>
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className={`h-full rounded-full transition-all ${
              percentage > 50 
                ? 'bg-green-500' 
                : percentage > 25 
                ? 'bg-amber-500' 
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(percentage, 3)}%` }}
          />
        </div>
      )}

      {isLow && tier === 'free' && (
        <a
          href="/pricing"
          className={`mt-3 block w-full text-center text-sm font-semibold py-2 px-4 rounded-lg transition-all ${
            isDark 
              ? 'btn-primary' 
              : 'bg-slate-900 text-white hover:bg-black'
          }`}
        >
          Upgrade for More
        </a>
      )}
    </div>
  );
}
