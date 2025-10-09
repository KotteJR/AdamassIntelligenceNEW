'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SubscriptionManager from '../components/SubscriptionManager';
import PlanFeaturesCard from '../components/PlanFeaturesCard';
import ThemeToggle, { useTheme } from '../components/ThemeToggle';
import { useUser } from '../contexts/UserContext';

export default function SubscriptionPage() {
  const { isDark } = useTheme();
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{ tier: string; analysesLimit: number } | null>(null);

  // Refresh session on page load (in case coming from Stripe redirect)
  useEffect(() => {
    const refreshSession = async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        await supabase.auth.getSession();
        setSessionRefreshed(true);
      } catch (err) {
        console.error('Failed to refresh session:', err);
        setSessionRefreshed(true);
      }
    };
    refreshSession();
  }, []);

  // Fetch subscription data for features card
  useEffect(() => {
    const fetchSubscriptionData = async () => {
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
          setSubscriptionData({
            tier: data.tier || 'free',
            analysesLimit: data.analysesLimit || 1,
          });
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  useEffect(() => {
    if (sessionRefreshed && !isLoading && !user) {
      router.push('/?auth=1');
    }
  }, [user, isLoading, router, sessionRefreshed]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'theme-bg' : 'theme-bg'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${
          isDark ? 'border-slate-600' : 'border-slate-300'
        }`}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  return (
    <div className={`min-h-screen ${isDark ? 'theme-bg' : 'theme-bg'}`}>
      {/* Header matching report page */}
      <div className={`z-30 border-b ${isDark ? 'theme-border theme-bg' : 'border-slate-200 bg-white/70'} backdrop-blur`}>
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img src="/logo/adamass.svg" alt="Adamass" className={`h-6 ${isDark ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                isDark 
                  ? 'btn-primary' 
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="mb-8 md:mt-6">
          <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
            Manage your subscription
          </h2>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
            Hello {user?.name || user?.email || 'there'}
          </h1>
          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
            View your current plan, usage, and billing information
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <SubscriptionManager />
          {subscriptionData && (
            <PlanFeaturesCard 
              tier={subscriptionData.tier} 
              analysesLimit={subscriptionData.analysesLimit} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
