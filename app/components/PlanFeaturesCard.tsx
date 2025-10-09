'use client';

import React from 'react';
import { useTheme } from './ThemeToggle';

interface PlanFeaturesCardProps {
  tier: string;
  analysesLimit: number;
}

export default function PlanFeaturesCard({ tier, analysesLimit }: PlanFeaturesCardProps) {
  const { isDark } = useTheme();

  const planFeatures = {
    free: {
      title: 'Free Plan Features',
      description: 'Perfect for trying out the platform',
      features: [
        { label: 'Company Analyses', value: '1 per month', available: true },
        { label: 'Basic Reports', value: 'Text only', available: true },
        { label: 'Audio Reports', value: 'Not available', available: false },
        { label: 'Mind Map Visualizations', value: 'Not available', available: false },
        { label: 'SWOT Analysis', value: 'Not available', available: false },
        { label: 'Podcast Generation', value: 'Not available', available: false },
        { label: 'Support', value: 'Community', available: true },
      ],
    },
    pro: {
      title: 'Pro Plan Features',
      description: 'Everything you need for professional analysis',
      features: [
        { label: 'Company Analyses', value: '10 per month', available: true },
        { label: 'Full Reports', value: 'Complete access', available: true },
        { label: 'Audio Reports', value: 'Included', available: true },
        { label: 'Mind Map Visualizations', value: 'Included', available: true },
        { label: 'SWOT Analysis', value: 'Included', available: true },
        { label: 'Podcast Generation', value: 'Included', available: true },
        { label: 'Support', value: 'Priority support', available: true },
      ],
    },
    enterprise: {
      title: 'Enterprise Plan Features',
      description: 'Unlimited access to all features',
      features: [
        { label: 'Company Analyses', value: 'Unlimited', available: true },
        { label: 'Full Reports', value: 'Complete access', available: true },
        { label: 'Audio Reports', value: 'Included', available: true },
        { label: 'Mind Map Visualizations', value: 'Included', available: true },
        { label: 'SWOT Analysis', value: 'Included', available: true },
        { label: 'Podcast Generation', value: 'Included', available: true },
        { label: 'Custom Integrations', value: 'Available', available: true },
        { label: 'API Access', value: 'Full access', available: true },
        { label: 'Support', value: 'Dedicated support', available: true },
      ],
    },
  };

  const currentPlan = planFeatures[tier as keyof typeof planFeatures] || planFeatures.free;

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
      <div className="mb-6">
        <h2 className={`text-xl font-bold mb-1 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
          {currentPlan.title}
        </h2>
        <p className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
          {currentPlan.description}
        </p>
      </div>

      <div className="space-y-3">
        {currentPlan.features.map((feature, idx) => (
          <div 
            key={idx} 
            className={`flex items-center justify-between py-2 ${
              idx !== currentPlan.features.length - 1 
                ? `border-b ${isDark ? 'theme-border' : 'border-slate-100'}` 
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                {feature.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {feature.available ? (
                <>
                  <span className={`text-sm font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                    {feature.value}
                  </span>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-400'}`}>
                    {feature.value}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {tier === 'free' && (
        <div className={`mt-6 pt-6 border-t ${isDark ? 'theme-border' : 'border-slate-200'}`}>
          <p className={`text-sm mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
            Unlock all features with Pro or Enterprise
          </p>
          <a
            href="/pricing"
            className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'btn-primary' 
                : 'bg-slate-900 text-white hover:bg-black'
            }`}
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}

