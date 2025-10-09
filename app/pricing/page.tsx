'use client';

import React from 'react';
import Link from 'next/link';
import PricingTable from '../components/PricingTable';
import ThemeToggle, { useTheme } from '../components/ThemeToggle';

export default function PricingPage() {
  const { isDark } = useTheme();
  
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
        <PricingTable />
      </div>
    </div>
  );
}
