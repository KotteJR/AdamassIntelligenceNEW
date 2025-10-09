'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle, { useTheme } from '../components/ThemeToggle';

export default function AboutPage() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'theme-bg' : 'theme-bg'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'theme-border theme-bg' : 'border-slate-200 bg-white/70'} backdrop-blur`}>
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

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-14 md:space-y-24">
        
        {/* Hero Section */}
        <section className="mt-14">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h1 className={`text-5xl md:text-5xl font-medium leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Why Adamass Intelligence for Due Diligence?
              </h1>
            </div>
            <div className="space-y-6 md:mt-40">
              <p className={`text-base leading-relaxed text-justify ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                Due diligence processes require time and thoroughness—that's understood and necessary. However, when conducting desktop reviews based exclusively on publicly available information, manual processes are no longer the only viable approach. Modern AI technology enables systematic, unbiased analysis while maintaining the rigor essential to comprehensive due diligence.
              </p>
              <p className={`text-base leading-relaxed text-justify ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                Adamass Intelligence represents our institutional approach to due diligence, distilled into an accessible platform. We've systematized our analytical framework—refined through years of client engagements—to deliver comprehensive desktop reviews in under five minutes, ensuring consistency, eliminating subjective bias, and maintaining the same standard of excellence we apply to our direct advisory work.
              </p>
            </div>
          </div>
        </section>
        {/* Learn more about Adamass Intelligence */}
        <section>
          <h2 className={`text-md font-semibold uppercase tracking-wide mb-4 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
            Learn more about Adamass Intelligence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                key: 'data',
                title: 'Unified Data Engine',
                lines: [
                  'Aggregates trusted public sources and industry datasets.',
                  'De-duplicates, normalizes, and keeps everything fresh.'
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <ellipse cx="12" cy="5" rx="8" ry="3" />
                    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
                    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                  </svg>
                ),
              },
              {
                key: 'pipeline',
                title: 'Analysis Pipeline',
                lines: [
                  'LLM + rules engine evaluates company, market and competitors.',
                  'Each step is auditable, consistent, and repeatable for minimization of subjective bias.'
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 5a5 5 0 015 5v1h1a3 3 0 010 6h-3" />
                    <path d="M12 5a5 5 0 00-5 5v1H6a3 3 0 100 6h3" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                ),
              },
              {
                key: 'reports',
                title: 'Instant Reports',
                lines: [
                  'Generates investor-grade reports in less than ten minutes.',
                  'Certified presentation-ready reports exported to PDF and share secure links.'
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="6" y="3" width="12" height="18" rx="2" />
                    <path d="M9 7h6M9 11h6M9 15h4" />
                  </svg>
                ),
              },
              {
                key: 'visuals',
                title: 'Visual Intelligence',
                lines: [
                  'Interactive Mind maps, SWOT analyses and visual patterns for rapid insights.',
                  'Toggle sections and drill down into details.'
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                ),
              },
              {
                key: 'audio',
                title: 'Audio Briefings',
                lines: [
                  'Get concise audio summaries for rapid review and easy consumption.',
                  'Perfect for busy teams that need quick context.'
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="8" width="5" height="8" rx="2" />
                    <rect x="15" y="5" width="5" height="14" rx="2" />
                    <path d="M9 12h6" />
                  </svg>
                ),
              },
              {
                key: 'chat',
                title: 'Ask & Explore',
                lines: [
                  'Interact with and ask follow‑up questions directly on report context.',
                  
                ],
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.key}
                className={`relative p-6 pr-10 pb-8 md:pr-14 md:pb-10 rounded-xl border ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
              >
                {/* Icon badge (bottom-right, slightly outside) */}
                <div className={`absolute -bottom-3 -right-3 flex h-14 w-14 items-center justify-center rounded-full border ${
                  isDark ? 'theme-text border-[color:var(--border-primary)] bg-[color:var(--bg-primary)]' : 'text-slate-700 border-slate-300 bg-white'
                }`}>
                  {feature.icon}
                </div>

                <h3 className={`text-base text-lg font-medium mb-2 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  {feature.title}
                </h3>
                <p className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'} text-sm`}>{feature.lines[0]}</p>
                <p className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'} text-sm mt-1`}>{feature.lines[1]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What You Get - Two column accordion (full width) */}
        <section className="w-full">
          <h2 className={`text-md font-semibold uppercase tracking-wide mb-4 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
            What You Get
          </h2>

          {/* 2 columns x 3 rows accordion. Each column manages its own open state so only that column expands. */}
          <div className="grid grid-cols-2 gap-8">
            {[0, 1].map((col) => (
              <AccordionColumn key={col} isDark={isDark} columnIndex={col} />
            ))}
          </div>
        </section>

        {/* Who Uses - Case-style cards (2x2) */}
        <section>
          <h2 className={`text-md font-semibold uppercase tracking-wide mb-4 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
            Who Uses Adamass Intelligence?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                client: 'Venture & PE funds',
                headline: 'Venture & PE funds',
                challenge:
                  'Traditional desktop research is slow and inconsistent across analysts. Data is scattered and difficult to audit under time pressure.',
                solution:
                  'Adamass standardizes diligence with auditable steps, investor‑grade reports in minutes, and transparent sourcing—so you move decisively and with confidence.'
              },
              {
                client: 'Corporate strategy teams',
                headline: 'Corporate strategy teams',
                challenge:
                  'Getting a crisp view of competitors, entrants and whitespace requires weeks of manual research and expensive decks.',
                solution:
                  'Adamass delivers living market maps, SWOTs and tailored narratives in minutes—fueling faster planning cycles and better decisions.'
              },
              {
                client: 'Consultancies & advisors',
                headline: 'Consultancies & advisors',
                challenge:
                  'Analysts burn cycles on baseline research and formatting, squeezing time for true advisory value.',
                solution:
                  'Use Adamass to generate presentation‑ready briefs, then focus your team on recommendations, workshops and change management.'
              },
              {
                client: 'Revenue & BD teams',
                headline: 'Revenue & BD teams',
                challenge:
                  'Account research is inconsistent across regions and products; messaging lacks authority with senior buyers.',
                solution:
                  'Adamass produces authoritative company briefs and talking points on demand—raising meeting quality and shortening cycles.'
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-6 md:p-8 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
              >
                {/* Heading */}
                <div className="mb-5">
                  <h3 className={`leading-tight ${isDark ? 'theme-text' : 'text-slate-900'} text-2xl md:text-2xl font-medium`}>
                    {card.headline}
                  </h3>
                </div>

                {/* Two-column body: challenge / solution (2 cols even on mobile) */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium mb-3 ${
                      isDark ? 'bg-red-900/50 border border-red-400 text-red-200' : 'bg-red-50 border border-red-400 text-red-700'
                    }`}>
                      Challenge
                    </div>
                    <p className={`${isDark ? 'theme-text-secondary' : 'text-slate-700'} text-sm md:text-base`}>{card.challenge}</p>
                  </div>
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium mb-3 ${
                      isDark ? 'bg-green-900/50 border border-green-400 text-green-200' : 'bg-green-50 border border-green-400 text-green-800'
                    }`}>
                      Solution
                    </div>
                    <p className={`${isDark ? 'theme-text-secondary' : 'text-slate-700'} text-sm md:text-base`}>{card.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

/* Local column accordion component */
function AccordionColumn({ isDark, columnIndex }: { isDark: boolean; columnIndex: number }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const allItems = [
    {
      title: 'Unified Data Engine',
      body:
        'Aggregates trusted public sources and industry datasets. De-duplicates, normalizes and keeps everything fresh so you always work from a single source of truth.'
    },
    {
      title: 'Analysis Pipeline',
      body:
        'LLM + rules engine evaluates company, market and competitors. Each step is auditable, consistent and repeatable to minimize bias.'
    },
    {
      title: 'Instant Reports',
      body:
        'Generates investor‑grade, presentation‑ready reports in minutes. Export to PDF and share secure links with stakeholders.'
    },
    {
      title: 'Visual Intelligence',
      body:
        'Interactive mind maps, SWOT and visual narratives reveal patterns. Toggle sections and drill down where it matters.'
    },
    {
      title: 'Audio Briefings',
      body:
        'Concise audio summaries for rapid review on the go—perfect for busy teams who need crisp context fast.'
    },
    {
      title: 'Ask & Explore',
      body:
        'Ask follow‑up questions directly on report context. Answers cite the underlying sections for transparency.'
    }
  ];

  // Split evenly: first 3 to left column, last 3 to right column
  const items = columnIndex === 0 ? allItems.slice(0, 3) : allItems.slice(3);

  return (
    <div className="space-y-0">
      {items.map((it, idx) => {
        const isOpen = openIdx === idx;
        const isLast = idx === items.length - 1;
        return (
          <div key={idx}>
            {/* row header */}
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className={`w-full flex items-center justify-between px-2 py-4 focus:outline-none`}
            >
              <span className={`text-lg ${isDark ? 'theme-text' : 'text-slate-800'} font-medium`}>
                {it.title}
              </span>
              <svg
                className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-90' : 'rotate-0'} ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M8 5l8 7-8 7" />
              </svg>
            </button>
            {/* constant divider below header (ultra-thin) */}
            {!isLast && (
              <div className={`h-px ${isDark ? 'bg-[color:var(--border-primary)]' : 'bg-slate-200'}`} />
            )}
            {/* animated content area */}
            <div
              className={`overflow-hidden will-change-[max-height] transition-[max-height] duration-500 ease-out ${isOpen ? 'max-h-48' : 'max-h-0'}`}
            >
              <div className={`px-4 py-3 text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'} transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                {it.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
