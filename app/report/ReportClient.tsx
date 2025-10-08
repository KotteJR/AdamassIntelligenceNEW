"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
// import { RevenueGrowthChart, InvestmentHistoryChart, MarketPresenceMap } from './CompanyIntelligenceCharts'; // Charts removed
import StrategicRecommendationItem from './StrategicRecommendationItem';
import { useReport } from './ReportContext';
import { useTheme } from '../components/ThemeToggle';

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { isDark } = useTheme();
  return (
    <section className="mb-12">
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
        <div className={`px-8 py-6 border-b ${isDark ? 'theme-border theme-bg-secondary' : 'border-slate-200 bg-slate-50'}`}>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </section>
  );
};

// New DetailedInfoCard Component
interface DetailedInfoCardProps {
  title: string;
  items?: string[];
  itemClassName?: string;
  analysisTitle?: string;
  analysisText?: string;
  analysisBaseColor?: string;
  children?: React.ReactNode; // For custom content within the card
  gridCols?: string; // e.g., 'md:grid-cols-2' for internal grid layout
}

const DetailedInfoCard: React.FC<DetailedInfoCardProps> = ({
  title,
  items,
  itemClassName = "",
  analysisTitle,
  analysisText,
  analysisBaseColor = "gray",
  children,
  gridCols
}) => {
  const { isDark } = useTheme();
  return (
    <div className={`border rounded-xl overflow-hidden ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'theme-border theme-muted' : 'border-slate-200 bg-slate-50'}`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{title}</h3>
      </div>
      <div className="p-6">
        <div className={gridCols ? `grid gap-6 ${gridCols}` : ''}>
          {items && items.length > 0 && (
            <div className={`${gridCols ? 'col-span-1' : ''} ${analysisText && !gridCols ? 'mb-6' : ''}`}>
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li key={idx} className={`flex items-start gap-3 ${isDark ? 'theme-text-secondary' : 'text-slate-700'} ${itemClassName}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${isDark ? 'theme-text-muted' : 'bg-slate-400'}`}></div>
                    <span className="text-sm">{typeof item === 'string' || typeof item === 'number' ? item : JSON.stringify(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisText && (
             <div className={`${gridCols && items && items.length > 0 ? 'col-span-1' : ''} ${!gridCols && items && items.length === 0 ? 'mt-0' : gridCols ? 'md:mt-0' : 'mt-4' }`}>
              {analysisTitle && <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-800'}`}>{analysisTitle}</h4>}
              <p className={`whitespace-pre-line leading-relaxed text-sm ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{analysisText}</p>
            </div>
          )}

          {children && (items || analysisText ? <div className={gridCols ? `md:col-span-full mt-4 pt-4 border-t ${isDark ? 'theme-border' : 'border-slate-200'}` : `mt-4 pt-4 border-t ${isDark ? 'theme-border' : 'border-slate-200'}`}>{children}</div> : children)}
        </div>
      </div>
    </div>
  );
};

// Key Events Section Component with Show More/Less
const KeyEventsSection: React.FC<{ events: any[]; isDark: boolean }> = ({ events, isDark }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedEvents = showAll ? events : events.slice(0, 3);
  const hasMore = events.length > 3;

  return (
    <>
      <div className="space-y-4">
        {displayedEvents.map((event: any, idx: number) => (
          <div key={idx} className={`border rounded-xl p-5 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <h5 className={`font-semibold text-base flex-1 ${isDark ? 'theme-text' : 'text-slate-800'}`}>
                {event.headline}
              </h5>
              <span className={`px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap ml-3 ${
                event.sentiment === 'positive' 
                  ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                  : event.sentiment === 'negative'
                  ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                  : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600')
              }`}>
                {event.sentiment}
              </span>
            </div>
            
            <p className={`text-xs mb-3 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
              {new Date(event.publishedAt).toLocaleDateString()} • {event.source}
            </p>
            
            <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
              {event.summary}
            </p>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className={`text-xs font-medium mb-1 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Relevance</div>
                <div className={`text-lg font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{event.relevance}%</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className={`text-xs font-medium mb-1 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Confidence</div>
                <div className={`text-lg font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{event.confidence}%</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className={`text-xs font-medium mb-1 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Horizon</div>
                <div className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{event.impact_horizon}</div>
              </div>
            </div>

            {event.url && (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${isDark ? 'accent' : 'text-blue-600'}`}>
                Read full article
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Show More / Show Less Button */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {showAll ? (
              <span className="flex items-center gap-2">
                Show Less
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Show More ({events.length - 3} more)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
};

const ReportClient = () => {
  const { report, isLoading, jobId } = useReport();

  if (isLoading) {
    const { isDark } = useTheme();
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'theme-bg' : 'bg-white'}`}>
        <p className={`text-xl ${isDark ? 'text-white' : 'text-gray-700'}`}>Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Report Not Found</h1>
        <p className="text-gray-700 mb-2">No report found for Job ID: <span className='font-mono'>{jobId || 'Unknown'}</span>.</p>
        <Link href="/" className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          &larr; Back to Home
        </Link>
      </div>
    );
  }

  const { 
    companyAlias, 
    dateGenerated, 
    architecture, 
    security, 
    financials,
    companyIntelligence 
  } = report || {};

  // Helper function to format period labels
  const formatPeriod = (period: string): string => {
    const periodMap: { [key: string]: string } = {
      '1D': '1 Day',
      '1W': '1 Week',
      '1M': '1 Month',
      '6M': '6 Months',
      'YTD': 'Year to Date',
      // Legacy support for old format
      '1m': '1 Min',
      '15m': '15 Min',
      '1h': '1 Hour'
    };
    return periodMap[period] || period;
  };

  // Helper to render score bars
  const renderScoreBar = (label: string, score: number | undefined, key?: string, maxScore = 10) => {
    const { isDark } = useTheme();
    if (typeof score !== 'number') return <div key={key} className="mb-6"><span className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{label}: N/A</span></div>;
    const percentage = (score / maxScore) * 100;
    let bgColor = 'bg-red-500';
    let textColor = 'text-red-600';
    if (percentage >= 70) {
      bgColor = 'bg-green-500';
      textColor = 'text-green-600';
    } else if (percentage >= 40) {
      bgColor = 'bg-amber-500';
      textColor = 'text-amber-600';
    }
    return (
      <div key={key} className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
          <span className={`font-semibold ${textColor}`}>{score}/{maxScore}</span>
        </div>
        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
          <div className={`${bgColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  // Helper for section text
  const SectionText: React.FC<{ data: any }> = ({ data }) => {
    const { isDark } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data || typeof data !== 'object' || data.error) {
      return <p className={`italic text-sm ${isDark ? 'theme-text-muted' : 'text-slate-400'}`}>Data not available or error in processing.</p>;
    }

    const hasExpandableContent = data.text && data.text.length > 300;
    const displayText = hasExpandableContent && !isExpanded ? `${data.text.slice(0, 300)}...` : data.text;

    return (
      <div className="space-y-4">
        {data.highlight && (
          <div className={`border-l-4 p-4 rounded-r-lg ${isDark ? 'theme-muted border-[color:var(--border-secondary)]' : 'bg-slate-50 border-slate-400'}`}>
            <p className={`text-base font-medium ${isDark ? 'theme-text' : 'text-slate-800'}`}>{data.highlight}</p>
          </div>
        )}
        {data.preview && <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{data.preview}</p>}
        {data.text && (
          <div className="relative">
            <p className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{displayText}</p>
            {hasExpandableContent && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-2 text-sm font-medium flex items-center gap-1 group ${isDark ? 'theme-text-muted hover:theme-text-secondary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {isExpanded ? (
                  <>
                    Show Less
                    <svg className="w-4 h-4 transform rotate-180 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                ) : (
                  <>
                    Read More
                    <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const { isDark } = useTheme();
  
  return (
    <main className={`min-h-screen pt-24 ${isDark ? 'theme-card' : 'bg-white'}`}>
      {/* Floating Back Button - REMOVED
      <Link href="/" className="fixed top-8 left-8 z-50 px-5 py-2.5 bg-white text-gray-700 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Home
      </Link>
      */}
      <div className="max-w-6xl mx-auto py-12 px-8">
        <header className="mb-12 text-center">
          <h1 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {companyAlias}
          </h1>
          <p className={`text-lg mb-2 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Comprehensive Desktop Review</p>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Generated on {new Date(dateGenerated).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </header>

        {/* Score Overview Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {architecture?.overall_score !== undefined && (
              <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.75M9 12h6.75m-6.75 5.25h6.75M5.25 21v-18a2.25 2.25 0 0 1 2.25-2.25h9a2.25 2.25 0 0 1 2.25 2.25v18" />
                  </svg>
                  <h3 className={`text-base font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Architecture Score</h3>
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{architecture.overall_score}/10</p>
              </div>
            )}
            {security?.overall_score !== undefined && (
              <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                 <div className="flex items-center gap-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622A11.99 11.99 0 0 0 18.402 6a11.959 11.959 0 0 1-1.043-.751" />
                  </svg>
                  <h3 className={`text-base font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Security Score</h3>
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{security.overall_score}/10</p>
              </div>
            )}
            {financials?.overall_score !== undefined && (
              <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                  <h3 className={`text-base font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Financial Score</h3>
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{financials.overall_score}/10</p>
              </div>
            )}
          </div>
        </section>

        {/* ADAMASS INTELLIGENCE REPORT - MOVED FIRST */}
        {report?.adamassSynthesisReport && (
          <SectionCard title="Adamass Intelligence Report">
            <div className="space-y-6">
              {/* Executive Summary */}
              {report.adamassSynthesisReport.executive_summary && (
                <div> 
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-800'}`}>Executive Summary</h3>
                  <div className={`border-l-4 p-4 rounded-r-lg ${isDark ? 'theme-muted border-[color:var(--border-secondary)]' : 'bg-slate-50 border-slate-400'}`}>
                    <p className={`leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                      {report.adamassSynthesisReport.executive_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              {report.adamassSynthesisReport.overall_assessment && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-800'}`}>Overall Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className={`border rounded-lg p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <p className={`text-xs mb-1 uppercase tracking-wider ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>Verdict</p>
                        <p className={`text-xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{report.adamassSynthesisReport.overall_assessment.verdict}</p>
                      </div>
                      <div className={`border rounded-lg p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <p className={`text-xs mb-1 uppercase tracking-wider ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>Confidence Score</p>
                        <div className="flex items-baseline">
                          <p className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                            {parseFloat(report.adamassSynthesisReport.overall_assessment.confidence_score).toFixed(1)}
                          </p>
                          <span className={`text-lg ml-1 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>/ 10</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs mb-2 uppercase tracking-wider ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>Key Rationale</p>
                      <div className={`border p-4 rounded-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                         <p className={`leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{report.adamassSynthesisReport.overall_assessment.key_rationale}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Risks & Mitigation */}
              {report.adamassSynthesisReport.key_risks_and_mitigation && report.adamassSynthesisReport.key_risks_and_mitigation.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Risks & Mitigation Strategies</h3>
                  <div className="space-y-4">
                    {report.adamassSynthesisReport.key_risks_and_mitigation.map((item: any, index: number) => (
                      <div key={index} className={`border rounded-lg p-4 border-l-4 border-red-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`text-sm font-semibold flex-grow pr-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                            <span className="font-bold">Risk:</span> {item.risk}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                            item.severity === 'High' 
                              ? (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700') 
                              : item.severity === 'Medium' 
                                ? (isDark ? 'bg-amber-900/30 text-amber-400 border border-amber-700' : 'bg-amber-100 text-amber-700') 
                                : (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700')
                          }`}>
                            {item.severity} Severity
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="font-semibold">Mitigation:</span> {item.mitigation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Potential Synergies */}
              {report.adamassSynthesisReport.potential_synergies && (report.adamassSynthesisReport.potential_synergies.cost_synergies?.length > 0 || report.adamassSynthesisReport.potential_synergies.revenue_synergies?.length > 0) && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Potential Synergies</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Cost Synergies */}
                    {report.adamassSynthesisReport.potential_synergies.cost_synergies && report.adamassSynthesisReport.potential_synergies.cost_synergies.length > 0 && (
                      <div className={`border rounded-lg p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-base font-semibold mb-3 border-l-4 border-blue-500 pl-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cost Synergies</h4>
                        {report.adamassSynthesisReport.potential_synergies.overall_cost_synergy_summary && (
                           <p className={`text-sm mb-3 italic ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{report.adamassSynthesisReport.potential_synergies.overall_cost_synergy_summary}</p>
                        )}
                        <div className="space-y-3">
                          {report.adamassSynthesisReport.potential_synergies.cost_synergies.map((synergy: any, index: number) => (
                            <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800 theme-border' : 'bg-slate-50 border-slate-200'}`}>
                              <h5 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{synergy.area}</h5>
                              <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><strong>Est. Savings:</strong> {synergy.estimated_annual_savings || synergy.estimated_annual_savings_usd}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><strong>Timeline:</strong> {synergy.realization_timeline}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revenue Synergies */}
                    {report.adamassSynthesisReport.potential_synergies.revenue_synergies && report.adamassSynthesisReport.potential_synergies.revenue_synergies.length > 0 && (
                      <div className={`border rounded-lg p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-base font-semibold mb-3 border-l-4 border-green-500 pl-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Revenue Synergies</h4>
                         {report.adamassSynthesisReport.potential_synergies.overall_revenue_synergy_summary && (
                           <p className={`text-sm mb-3 italic ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{report.adamassSynthesisReport.potential_synergies.overall_revenue_synergy_summary}</p>
                        )}
                        <div className="space-y-3">
                          {report.adamassSynthesisReport.potential_synergies.revenue_synergies.map((synergy: any, index: number) => (
                            <div key={index} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800 theme-border' : 'bg-slate-50 border-slate-200'}`}>
                              <h5 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{synergy.area}</h5>
                              <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><strong>Est. Revenue Inc.:</strong> {synergy.estimated_annual_revenue || synergy.estimated_annual_revenue_usd}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><strong>Timeline:</strong> {synergy.realization_timeline}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Strategic Recommendations */}
              {report.adamassSynthesisReport.strategic_recommendations && report.adamassSynthesisReport.strategic_recommendations.length > 0 && (
                 <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-800'}`}>Strategic Recommendations</h3>
                  <div className="space-y-4">
                    {report.adamassSynthesisReport.strategic_recommendations.map((rec: any, index: number) => (
                      <div key={rec.id || index} className={`border rounded-lg p-4 border-l-4 ${isDark ? 'theme-card theme-border border-l-[color:var(--border-secondary)]' : 'bg-white border-slate-200 border-l-slate-400'}`}>
                         <StrategicRecommendationItem recommendation={rec} index={index} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing Statement */}
              {report.adamassSynthesisReport.closing_statement && (
                <div> 
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-800'}`}>Closing Statement</h3>
                  <div className={`border-l-4 p-4 rounded-r-lg ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                    <p className={`leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                      {report.adamassSynthesisReport.closing_statement}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ARCHITECTURE SECTION - REMAINS SECOND (effectively) */}
        <SectionCard title="Architecture Analysis">
          {architecture?.error ? (
            <p className="text-red-500 text-sm">Error: {architecture.error}</p>
          ) : architecture ? (
            <div className="space-y-8">
              {/* Scores Section */}
              <div>
                {architecture.subscores && Object.entries(architecture.subscores).map(([key, value]) =>
                  renderScoreBar(key.charAt(0).toUpperCase() + key.slice(1), value as number, key)
                )}
              </div>

              {/* Badges Section */}
              {architecture.badges && Array.isArray(architecture.badges) && architecture.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {architecture.badges.map((badge: any, i: number) => (
                    <span key={i} className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      badge.type === 'positive' 
                        ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200')
                        : badge.type === 'negative' 
                          ? (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200')
                          : `${isDark ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-200'}`
                    }`}>{badge.label || badge}</span>
                  ))}
                </div>
              )}

              {/* Strengths and Risks Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {architecture.main_good && (
                  <div className={`border rounded-xl p-6 border-l-4 border-green-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Key Strengths</h4>
                    <ul className="space-y-3">
                      {architecture.main_good.map((good: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{good}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {architecture.main_risks && (
                  <div className={`border rounded-xl p-6 border-l-4 border-red-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Key Risks</h4>
                    <ul className="space-y-3">
                      {architecture.main_risks.map((risk: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Detailed Analysis Section */}
              <div className="space-y-6">
                {architecture.summary && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Summary</h3>
                    <SectionText data={architecture.summary} />
                  </div>
                )}
                {architecture.insights && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Insights</h3>
                    <SectionText data={architecture.insights} />
                  </div>
                )}
                {architecture.recommendations && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recommendations</h3>
                    <SectionText data={architecture.recommendations} />
                  </div>
                )}
              </div>
            </div>
          ) : <p className="text-slate-400 italic text-sm">No architecture data available.</p>}
        </SectionCard>

        {/* SECURITY SECTION - REMAINS THIRD (effectively) */}
        <SectionCard title="Security Analysis">
          {security?.error ? (
            <p className="text-red-500 text-sm">Error: {security.error}</p>
          ) : security ? (
            <div className="space-y-8">
              {/* Scores Section */}
              <div>
                {security.subscores && Object.entries(security.subscores).map(([key, value]) =>
                  renderScoreBar(key.charAt(0).toUpperCase() + key.slice(1), value as number, `security-${key}`)
                )}
              </div>

              {/* Badges Section */}
              {security.badges && Array.isArray(security.badges) && security.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {security.badges.map((badge: any, i: number) => (
                    <span key={i} className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      badge.type === 'positive' 
                        ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200')
                        : badge.type === 'negative' 
                          ? (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200')
                          : `${isDark ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-200'}`
                    }`}>{badge.label || badge}</span>
                  ))}
                </div>
              )}

              {/* Strengths and Risks Section for Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {security.main_good && Array.isArray(security.main_good) && security.main_good.length > 0 && (
                  <div className={`border rounded-xl p-6 border-l-4 border-green-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Key Strengths</h4>
                    <ul className="space-y-3">
                      {security.main_good.map((good: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{good}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {security.main_risks && Array.isArray(security.main_risks) && security.main_risks.length > 0 && (
                  <div className={`border rounded-xl p-6 border-l-4 border-red-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Key Risks</h4>
                    <ul className="space-y-3">
                      {security.main_risks.map((risk: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Findings Table */}
              {security.findings && Array.isArray(security.findings) && security.findings.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Security Findings</h3>
                  <div className={`overflow-x-auto border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-sm">
                      <thead className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <tr>
                          {Object.keys(security.findings[0] || {}).map(key => (
                            <th key={key} className={`px-4 py-3 text-left font-semibold text-sm border-b ${isDark ? 'text-slate-300 theme-border' : 'text-slate-700 border-slate-200'}`}>
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {security.findings.map((finding: any, i: number) => (
                          <tr key={i} className={`${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                            {Object.values(finding).map((value: any, j: number) => (
                              <td key={j} className={`px-4 py-3 border-b text-sm ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detailed Analysis Section */}
              <div className="space-y-6">
                {security.summary && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Summary</h3>
                    <SectionText data={security.summary} />
                  </div>
                )}
                {security.insights && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Insights</h3>
                    <SectionText data={security.insights} />
                  </div>
                )}
                {security.recommendations && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recommendations</h3>
                    <SectionText data={security.recommendations} />
                  </div>
                )}
              </div>
            </div>
          ) : <p className="text-slate-400 italic text-sm">No security data available.</p>}
        </SectionCard>

        {/* FINANCIALS SECTION */}
        <SectionCard title="Financial Analysis">
          {financials?.error ? (
            <p className="text-red-500 text-sm">Error: {financials.error}</p>
          ) : financials ? (
            <div className="space-y-8">
              {/* Scores Section */}
              <div>
                {financials.subscores && Object.entries(financials.subscores).map(([key, value]) =>
                  renderScoreBar(
                    key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
                    value as number, 
                    `financials-${key}`
                  )
                )}
              </div>

              {/* Badges Section */}
              {financials.badges && Array.isArray(financials.badges) && financials.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {financials.badges.map((badge: any, i: number) => (
                    <span key={i} className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      badge.type === 'positive' 
                        ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200')
                        : badge.type === 'negative' 
                          ? (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200')
                          : `${isDark ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-200'}`
                    }`}>{badge.label || badge}</span>
                  ))}
                </div>
              )}

              {/* Key Metrics Section */}
              {financials.key_metrics && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Financial Metrics</h3>
                  <div className={`border rounded-xl overflow-hidden ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {Object.entries(financials.key_metrics).map(([key, value], index) => {
                        if (!value) return null;
                        const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        
                        // Determine icon and color based on metric type
                        let icon = null;
                        let iconColor = '';
                        let iconBg = '';
                        
                        if (key.includes('market_cap')) {
                          iconColor = isDark ? 'text-blue-400' : 'text-blue-600';
                          iconBg = isDark ? 'bg-blue-500/10' : 'bg-blue-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          );
                        } else if (key.includes('stock_price')) {
                          iconColor = isDark ? 'text-emerald-400' : 'text-emerald-600';
                          iconBg = isDark ? 'bg-emerald-500/10' : 'bg-emerald-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          );
                        } else if (key.includes('pe_ratio')) {
                          iconColor = isDark ? 'text-purple-400' : 'text-purple-600';
                          iconBg = isDark ? 'bg-purple-500/10' : 'bg-purple-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          );
                        } else if (key.includes('revenue')) {
                          iconColor = isDark ? 'text-amber-400' : 'text-amber-600';
                          iconBg = isDark ? 'bg-amber-500/10' : 'bg-amber-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          );
                        } else if (key.includes('income') || key.includes('ebitda') || key.includes('margin')) {
                          iconColor = isDark ? 'text-teal-400' : 'text-teal-600';
                          iconBg = isDark ? 'bg-teal-500/10' : 'bg-teal-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          );
                        } else {
                          iconColor = isDark ? 'text-slate-400' : 'text-slate-600';
                          iconBg = isDark ? 'bg-slate-500/10' : 'bg-slate-100';
                          icon = (
                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          );
                        }
                        
                        const metricsArray = Object.entries(financials.key_metrics).filter(([k, v]) => v);
                        const totalMetrics = metricsArray.length;
                        const isLastRow = index >= totalMetrics - 2;
                        const isOdd = index % 2 === 0;
                        
                        return (
                          <div 
                            key={key}
                            className={`flex items-center justify-between px-6 py-4 transition-colors ${
                              isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                            } ${!isLastRow ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-slate-100') : ''} ${
                              isOdd ? (isDark ? 'lg:border-r lg:border-slate-700/50' : 'lg:border-r lg:border-slate-100') : ''
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2.5 rounded-lg ${iconBg}`}>
                                {icon}
                              </div>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {label}
                              </span>
                            </div>
                            <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {String(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths and Risks Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {financials.main_good && Array.isArray(financials.main_good) && financials.main_good.length > 0 && (
                  <div className={`border rounded-xl p-6 border-l-4 border-green-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Key Strengths</h4>
                    <ul className="space-y-3">
                      {financials.main_good.map((good: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{good}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {financials.main_risks && Array.isArray(financials.main_risks) && financials.main_risks.length > 0 && (
                  <div className={`border rounded-xl p-6 border-l-4 border-red-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Key Risks</h4>
                    <ul className="space-y-3">
                      {financials.main_risks.map((risk: string, i: number) => (
                        <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recent News Section */}
              {financials.news_analysis?.recent_news && financials.news_analysis.recent_news.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recent News & Market Events</h3>
                  <div className="space-y-4">
                    {financials.news_analysis.recent_news.slice(0, 5).map((news: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-lg border ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h5 className={`font-semibold text-sm ${isDark ? 'theme-text' : 'text-slate-800'}`}>{news.headline}</h5>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-lg whitespace-nowrap ml-3 ${
                            news.sentiment === 'positive' 
                              ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                              : news.sentiment === 'negative'
                                ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                                : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600')
                          }`}>
                            {news.sentiment || 'neutral'}
                          </span>
                        </div>
                        <p className={`text-xs mb-2 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                          {news.date} • {news.source}
                        </p>
                        <p className={`text-sm mb-2 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{news.summary}</p>
                        {news.key_topics && news.key_topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {news.key_topics.map((topic: string, i: number) => (
                              <span key={i} className={`px-2 py-0.5 text-xs rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                        {news.url && (
                          <a href={news.url} target="_blank" rel="noopener noreferrer" className={`text-xs font-medium hover:underline mt-2 inline-block ${isDark ? 'accent' : 'text-blue-600'}`}>
                            Read more →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {financials.news_analysis.news_sentiment_summary && (
                    <div className={`mt-4 p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                      <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'theme-text' : 'text-slate-800'}`}>News Sentiment Analysis</h4>
                      <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{financials.news_analysis.news_sentiment_summary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Market Performance Section */}
              {financials.market_performance && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Market Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {financials.market_performance.stock_performance_summary && (
                      <div className={`p-4 border rounded-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Stock Performance</h4>
                        <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{financials.market_performance.stock_performance_summary}</p>
                      </div>
                    )}
                    {financials.market_performance.analyst_ratings && (
                      <div className={`p-4 border rounded-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Analyst Ratings</h4>
                        <div className="space-y-2">
                          {financials.market_performance.analyst_ratings.buy != null && (
                            <div className="flex justify-between text-sm">
                              <span className={isDark ? 'theme-text-muted' : 'text-slate-600'}>Buy:</span>
                              <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{financials.market_performance.analyst_ratings.buy}</span>
                            </div>
                          )}
                          {financials.market_performance.analyst_ratings.hold != null && (
                            <div className="flex justify-between text-sm">
                              <span className={isDark ? 'theme-text-muted' : 'text-slate-600'}>Hold:</span>
                              <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{financials.market_performance.analyst_ratings.hold}</span>
                            </div>
                          )}
                          {financials.market_performance.analyst_ratings.sell != null && (
                            <div className="flex justify-between text-sm">
                              <span className={isDark ? 'theme-text-muted' : 'text-slate-600'}>Sell:</span>
                              <span className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{financials.market_performance.analyst_ratings.sell}</span>
                            </div>
                          )}
                          {financials.market_performance.analyst_ratings.average_target_price && (
                            <div className={`pt-2 border-t ${isDark ? 'theme-border' : 'border-slate-200'}`}>
                              <div className="flex justify-between text-sm">
                                <span className={isDark ? 'theme-text-muted' : 'text-slate-600'}>Avg Target Price:</span>
                                <span className={`font-semibold ${isDark ? 'theme-text' : 'text-slate-800'}`}>{financials.market_performance.analyst_ratings.average_target_price}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historical Stock Performance Line Chart */}
              {financials.historical_data?.stock_price_timeline && financials.historical_data.stock_price_timeline.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Stock Price History</h3>
                  <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className="h-64 relative pr-16 pb-6">
                      {/* SVG Line Chart */}
                      <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <g className="opacity-20">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line
                              key={`grid-${i}`}
                              x1="20"
                              y1={10 + i * 45}
                              x2="780"
                              y2={10 + i * 45}
                              stroke={isDark ? '#94a3b8' : '#cbd5e1'}
                              strokeWidth="1"
                            />
                          ))}
                        </g>
                        
                        {/* Price line */}
                        {(() => {
                          const prices = financials.historical_data.stock_price_timeline.map((d: any) => d.close || 0);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          const priceRange = maxPrice - minPrice || 1;
                          
                          const points = financials.historical_data.stock_price_timeline.map((point: any, idx: number) => {
                            const x = 20 + (idx / (financials.historical_data.stock_price_timeline.length - 1)) * 760;
                            const y = 10 + (1 - (point.close - minPrice) / priceRange) * 180;
                            return `${x},${y}`;
                          }).join(' ');
                          
                          const areaPoints = `20,190 ${points} 780,190`;
                          
                          return (
                            <>
                              {/* Gradient fill under line */}
                              <defs>
                                <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                                </linearGradient>
                              </defs>
                              <polygon
                                points={areaPoints}
                                fill="url(#priceGradient)"
                              />
                              {/* Price line */}
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {/* Data points */}
                              {financials.historical_data.stock_price_timeline.map((point: any, idx: number) => {
                                const x = 20 + (idx / (financials.historical_data.stock_price_timeline.length - 1)) * 760;
                                const y = 10 + (1 - (point.close - minPrice) / priceRange) * 180;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#3b82f6"
                                    className="hover:r-6 transition-all"
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                      
                      {/* Labels */}
                      <div className="flex justify-between mt-3 px-1">
                        {financials.historical_data.stock_price_timeline.map((point: any, idx: number) => {
                          if (idx % Math.ceil(financials.historical_data.stock_price_timeline.length / 5) === 0 || idx === financials.historical_data.stock_price_timeline.length - 1) {
                            return (
                              <span key={idx} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      {/* Price range labels */}
                      <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-2">
                        {(() => {
                          const prices = financials.historical_data.stock_price_timeline.map((d: any) => d.close || 0);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          return (
                            <>
                              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                ${maxPrice.toFixed(2)}
                              </span>
                              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                ${minPrice.toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Capital Markets Analysis Section */}
              {financials.capital_markets_analysis && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Capital Markets Analysis</h3>
                  
                  {/* Market Overview Card */}
                  {(financials.capital_markets_analysis.market_confidence_index != null || financials.capital_markets_analysis.alignment) && (
                    <div className={`p-6 border rounded-xl mb-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Market Confidence Index */}
                        {financials.capital_markets_analysis.market_confidence_index != null && (
                          <div className="flex flex-col items-center">
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Market Confidence Index</h4>
                            <div className="relative w-32 h-32">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  stroke={isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 1)'}
                                  strokeWidth="8"
                                  fill="none"
                                />
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  stroke={
                                    financials.capital_markets_analysis.market_confidence_index >= 70
                                      ? '#10b981'
                                      : financials.capital_markets_analysis.market_confidence_index >= 40
                                      ? '#f59e0b'
                                      : '#ef4444'
                                  }
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${(financials.capital_markets_analysis.market_confidence_index / 100) * 351.86} 351.86`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-3xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                                  {Math.round(financials.capital_markets_analysis.market_confidence_index)}
                                </span>
                              </div>
                            </div>
                            <p className={`text-center text-sm mt-4 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                              {financials.capital_markets_analysis.market_confidence_index >= 70
                                ? 'High Confidence'
                                : financials.capital_markets_analysis.market_confidence_index >= 40
                                ? 'Moderate Confidence'
                                : 'Low Confidence'}
                            </p>
                          </div>
                        )}

                        {/* Trend Alignment */}
                        {financials.capital_markets_analysis.alignment && (
                          <div className="flex flex-col items-center justify-center">
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Trend Alignment</h4>
                            <div className="flex items-center justify-center h-32">
                              <span className={`px-6 py-3 text-2xl font-bold rounded-xl ${
                                financials.capital_markets_analysis.alignment === 'Aligned'
                                  ? (isDark ? 'bg-green-900/30 text-green-400 border-2 border-green-700' : 'bg-green-100 text-green-700 border-2 border-green-300')
                                  : financials.capital_markets_analysis.alignment === 'Divergent'
                                  ? (isDark ? 'bg-red-900/30 text-red-400 border-2 border-red-700' : 'bg-red-100 text-red-700 border-2 border-red-300')
                                  : (isDark ? 'bg-slate-700 text-slate-300 border-2 border-slate-600' : 'bg-slate-100 text-slate-700 border-2 border-slate-300')
                              }`}>
                                {financials.capital_markets_analysis.alignment}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interval Metrics Charts */}
                  {financials.capital_markets_analysis.intervals && financials.capital_markets_analysis.intervals.length > 0 && (
                    <div className="space-y-6">
                      {/* Volatility Bar Chart */}
                      <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-sm font-semibold mb-6 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Volatility Trend</h4>
                        <div className="h-56 flex items-end justify-around gap-4 px-4">
                          {financials.capital_markets_analysis.intervals.map((interval: any, idx: number) => {
                            const maxVolatility = Math.max(...financials.capital_markets_analysis.intervals.map((i: any) => i.volatility || 0));
                            const heightPercent = maxVolatility > 0 ? (interval.volatility / maxVolatility) * 100 : 0;
                            const barColor = interval.volatility >= 60 ? (isDark ? 'bg-red-500' : 'bg-red-400') : interval.volatility >= 30 ? (isDark ? 'bg-amber-500' : 'bg-amber-400') : (isDark ? 'bg-green-500' : 'bg-green-400');
                            
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                                <div className="w-full flex flex-col items-center">
                                  <span className={`text-sm font-bold mb-2 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                                    {interval.volatility}%
                                  </span>
                                  <div className="w-full relative" style={{ height: '160px' }}>
                                    <div 
                                      className={`absolute bottom-0 w-full rounded-t-lg ${barColor} transition-colors`}
                                      style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                                    />
                                  </div>
                                </div>
                                <span className={`text-sm font-semibold ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                                  {formatPeriod(interval.period)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Growth Performance Chart */}
                      <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-sm font-semibold mb-6 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Growth Performance</h4>
                        <div className="space-y-5">
                          {financials.capital_markets_analysis.intervals.map((interval: any, idx: number) => {
                            const maxGrowth = Math.max(...financials.capital_markets_analysis.intervals.map((i: any) => Math.abs(i.growth || 0)));
                            const widthPercent = maxGrowth > 0 ? (Math.abs(interval.growth) / maxGrowth) * 45 : 0;
                            
                            return (
                              <div key={idx} className="flex items-center gap-4">
                                <span className={`text-sm font-semibold w-16 text-right ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                                  {formatPeriod(interval.period)}
                                </span>
                                <div className="flex-1 relative h-10 flex items-center">
                                  {/* Center line */}
                                  <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                                  
                                  {/* Growth bar */}
                                  {interval.growth >= 0 ? (
                                    <div 
                                      className={`absolute left-1/2 h-8 rounded-r-lg transition-all ${isDark ? 'bg-green-500' : 'bg-green-400'}`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  ) : (
                                    <div 
                                      className={`absolute right-1/2 h-8 rounded-l-lg transition-all ${isDark ? 'bg-red-500' : 'bg-red-400'}`}
                                      style={{ width: `${widthPercent}%` }}
                                    />
                                  )}
                                  
                                  {/* Value label */}
                                  <span 
                                    className={`absolute left-1/2 top-1/2 transform -translate-y-1/2 text-sm font-bold z-10 ${
                                      interval.growth >= 0 
                                        ? 'ml-3 text-green-600 dark:text-green-300' 
                                        : 'mr-3 -translate-x-full text-red-600 dark:text-red-300'
                                    }`}
                                  >
                                    {interval.growth > 0 ? '+' : ''}{interval.growth}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Momentum & Liquidity Combined Chart */}
                      <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <h4 className={`text-sm font-semibold mb-6 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Momentum Correlation & Liquidity</h4>
                        <div className="space-y-6">
                          {financials.capital_markets_analysis.intervals.map((interval: any, idx: number) => {
                            const corr = interval.momentum_corr;
                            const liquidity = interval.liquidity || 0;
                            
                            return (
                              <div key={idx}>
                                {/* Period Label */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-800'}`}>
                                    {formatPeriod(interval.period)}
                                  </span>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Momentum:</span>
                                      <span className={`text-sm font-bold ${
                                        corr >= 0.5 ? 'text-green-500' : corr >= 0 ? 'text-blue-500' : corr >= -0.5 ? 'text-amber-500' : 'text-red-500'
                                      }`}>
                                        {corr.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Liquidity:</span>
                                      <span className={`text-sm font-bold ${
                                        liquidity >= 75 ? 'text-green-500' : liquidity >= 50 ? 'text-blue-500' : liquidity >= 25 ? 'text-amber-500' : 'text-red-500'
                                      }`}>
                                        {liquidity}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Combined Visual */}
                                <div className="flex gap-3">
                                  {/* Momentum Correlation Bar */}
                                  <div className="flex-1">
                                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                      <div 
                                        className={`h-full rounded-full transition-all ${
                                          corr >= 0.5 ? (isDark ? 'bg-green-500' : 'bg-green-400')
                                          : corr >= 0 ? (isDark ? 'bg-blue-500' : 'bg-blue-400')
                                          : corr >= -0.5 ? (isDark ? 'bg-amber-500' : 'bg-amber-400')
                                          : (isDark ? 'bg-red-500' : 'bg-red-400')
                                        }`}
                                        style={{ width: `${Math.abs(corr) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Liquidity Bar */}
                                  <div className="flex-1">
                                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                      <div 
                                        className={`h-full rounded-full transition-all ${
                                          liquidity >= 75 ? (isDark ? 'bg-green-500' : 'bg-green-400')
                                          : liquidity >= 50 ? (isDark ? 'bg-blue-500' : 'bg-blue-400')
                                          : liquidity >= 25 ? (isDark ? 'bg-amber-500' : 'bg-amber-400')
                                          : (isDark ? 'bg-red-500' : 'bg-red-400')
                                        }`}
                                        style={{ width: `${liquidity}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Text Cards */}
                  {financials.capital_markets_analysis.analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {financials.capital_markets_analysis.analysis.volatility_analysis && (
                        <div className={`p-4 border-l-4 border-red-500 rounded-r-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Volatility Analysis</h5>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.capital_markets_analysis.analysis.volatility_analysis}
                          </p>
                        </div>
                      )}
                      {financials.capital_markets_analysis.analysis.growth_analysis && (
                        <div className={`p-4 border-l-4 border-green-500 rounded-r-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Growth Analysis</h5>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.capital_markets_analysis.analysis.growth_analysis}
                          </p>
                        </div>
                      )}
                      {financials.capital_markets_analysis.analysis.momentum_analysis && (
                        <div className={`p-4 border-l-4 border-blue-500 rounded-r-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Momentum Analysis</h5>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.capital_markets_analysis.analysis.momentum_analysis}
                          </p>
                        </div>
                      )}
                      {financials.capital_markets_analysis.analysis.liquidity_analysis && (
                        <div className={`p-4 border-l-4 border-purple-500 rounded-r-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Liquidity Analysis</h5>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.capital_markets_analysis.analysis.liquidity_analysis}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Overall Market Commentary */}
                  {financials.capital_markets_analysis.analysis?.overall_market_commentary && (
                    <div className={`mt-6 p-6 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                      <h5 className={`text-base font-semibold mb-3 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Overall Market Commentary</h5>
                      <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                        {financials.capital_markets_analysis.analysis.overall_market_commentary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Fundamentals Section */}
              {financials.financial_fundamentals && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Financial Fundamentals</h3>
                  
                  {/* Summary */}
                  {financials.financial_fundamentals.summary && (
                    <div className={`p-4 border-l-4 rounded-r-lg mb-6 ${isDark ? 'theme-muted border-l-blue-500' : 'bg-slate-50 border-l-blue-400'}`}>
                      <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                        {financials.financial_fundamentals.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Metrics Table */}
                  {financials.financial_fundamentals.key_metrics && (
                    <div className="mb-6">
                      <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Key Financial Metrics</h4>
                      <div className={`border rounded-xl overflow-hidden ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                          {Object.entries(financials.financial_fundamentals.key_metrics).map(([key, value], idx, arr) => {
                            if (value == null) return null;
                            
                            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                            const isGrowth = key.includes('growth');
                            
                            // Format label
                            const label = key
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            
                            // Determine icon and color based on metric type
                            let icon, iconBg;
                            if (key.includes('revenue')) {
                              icon = <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>;
                              iconBg = isDark ? 'bg-green-500/10' : 'bg-green-50';
                            } else if (key.includes('margin') || key.includes('roe') || key.includes('roa')) {
                              icon = <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/></svg>;
                              iconBg = isDark ? 'bg-blue-500/10' : 'bg-blue-50';
                            } else if (key.includes('debt')) {
                              icon = <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>;
                              iconBg = isDark ? 'bg-amber-500/10' : 'bg-amber-50';
                            } else if (key.includes('current_ratio')) {
                              icon = <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>;
                              iconBg = isDark ? 'bg-purple-500/10' : 'bg-purple-50';
                            } else {
                              icon = <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>;
                              iconBg = isDark ? 'bg-slate-500/10' : 'bg-slate-50';
                            }
                            
                            // Calculate row positioning for borders
                            const totalItems = arr.filter(([, v]) => v != null).length;
                            const isOdd = idx % 2 === 0;
                            const rowIndex = Math.floor(idx / 2);
                            const totalRows = Math.ceil(totalItems / 2);
                            const isLastRow = rowIndex === totalRows - 1;
                            
                            return (
                              <div 
                                key={key}
                                className={`flex items-center justify-between px-6 py-4 transition-colors ${
                                  isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                                } ${!isLastRow ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-slate-100') : ''} ${
                                  isOdd ? (isDark ? 'lg:border-r lg:border-slate-700/50' : 'lg:border-r lg:border-slate-100') : ''
                                }`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className={`p-2.5 rounded-lg ${iconBg}`}>
                                    {icon}
                                  </div>
                                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {label}
                                  </span>
                                </div>
                                <div className={`text-lg font-bold ${
                                  isGrowth
                                    ? (numValue > 0 ? 'text-green-500' : numValue < 0 ? 'text-red-500' : (isDark ? 'text-white' : 'text-slate-900'))
                                    : (isDark ? 'text-white' : 'text-slate-900')
                                }`}>
                                  {numValue.toFixed(2)}{key.includes('margin') || key.includes('roe') || key.includes('roa') || key.includes('growth') ? '%' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual Data Charts */}
                  {financials.financial_fundamentals.visual_data && (
                    <div className="space-y-6">
                      {/* Revenue & Net Income Charts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Revenue History */}
                        {financials.financial_fundamentals.visual_data.revenue_history && financials.financial_fundamentals.visual_data.revenue_history.length > 0 && (
                          <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Revenue History</h4>
                            <div className="h-48">
                              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.revenue_history;
                                  const values = data.map((d: any) => d.value);
                                  const maxVal = Math.max(...values);
                                  const minVal = Math.min(...values);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 150 - ((d.value - minVal) / range) * 130 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <>
                                      <defs>
                                        <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                                        </linearGradient>
                                      </defs>
                                      <polygon points={`0,150 ${points} 400,150`} fill="url(#revenueGradient)" />
                                      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between mt-2">
                                {financials.financial_fundamentals.visual_data.revenue_history.map((d: any, i: number) => (
                                  <span key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.year}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Net Income History */}
                        {financials.financial_fundamentals.visual_data.net_income_history && financials.financial_fundamentals.visual_data.net_income_history.length > 0 && (
                          <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Net Income History</h4>
                            <div className="h-48">
                              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.net_income_history;
                                  const values = data.map((d: any) => d.value);
                                  const maxVal = Math.max(...values);
                                  const minVal = Math.min(...values);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 150 - ((d.value - minVal) / range) * 130 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <>
                                      <defs>
                                        <linearGradient id="netIncomeGradient" x1="0" x2="0" y1="0" y2="1">
                                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                                        </linearGradient>
                                      </defs>
                                      <polygon points={`0,150 ${points} 400,150`} fill="url(#netIncomeGradient)" />
                                      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between mt-2">
                                {financials.financial_fundamentals.visual_data.net_income_history.map((d: any, i: number) => (
                                  <span key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.year}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EBITDA & FCF Charts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* EBITDA History */}
                        {financials.financial_fundamentals.visual_data.ebitda_history && financials.financial_fundamentals.visual_data.ebitda_history.length > 0 && (
                          <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>EBITDA History</h4>
                            <div className="h-48">
                              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.ebitda_history;
                                  const values = data.map((d: any) => d.value);
                                  const maxVal = Math.max(...values);
                                  const minVal = Math.min(...values);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 150 - ((d.value - minVal) / range) * 130 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <>
                                      <defs>
                                        <linearGradient id="ebitdaGradient" x1="0" x2="0" y1="0" y2="1">
                                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                                        </linearGradient>
                                      </defs>
                                      <polygon points={`0,150 ${points} 400,150`} fill="url(#ebitdaGradient)" />
                                      <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between mt-2">
                                {financials.financial_fundamentals.visual_data.ebitda_history.map((d: any, i: number) => (
                                  <span key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.year}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Free Cash Flow History */}
                        {financials.financial_fundamentals.visual_data.free_cash_flow_history && financials.financial_fundamentals.visual_data.free_cash_flow_history.length > 0 && (
                          <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                            <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Free Cash Flow History</h4>
                            <div className="h-48">
                              <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.free_cash_flow_history;
                                  const values = data.map((d: any) => d.value);
                                  const maxVal = Math.max(...values);
                                  const minVal = Math.min(...values);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = (i / (data.length - 1)) * 400;
                                    const y = 150 - ((d.value - minVal) / range) * 130 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <>
                                      <defs>
                                        <linearGradient id="fcfGradient" x1="0" x2="0" y1="0" y2="1">
                                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                                        </linearGradient>
                                      </defs>
                                      <polygon points={`0,150 ${points} 400,150`} fill="url(#fcfGradient)" />
                                      <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="flex justify-between mt-2">
                                {financials.financial_fundamentals.visual_data.free_cash_flow_history.map((d: any, i: number) => (
                                  <span key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.year}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assets vs Liabilities */}
                      {financials.financial_fundamentals.visual_data.assets_vs_liabilities && financials.financial_fundamentals.visual_data.assets_vs_liabilities.length > 0 && (
                        <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Assets vs Liabilities</h4>
                          <div className="space-y-6">
                            {financials.financial_fundamentals.visual_data.assets_vs_liabilities.map((d: any, idx: number) => {
                              const maxVal = Math.max(d.assets, d.liabilities);
                              return (
                                <div key={idx} className={`pb-6 ${idx < financials.financial_fundamentals.visual_data.assets_vs_liabilities.length - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-slate-100') : ''}`}>
                                  <div className={`text-xs font-semibold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.year}</div>
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between items-baseline mb-1.5">
                                        <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Assets</span>
                                        <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>${(d.assets / 1000000).toFixed(2)}M</span>
                                      </div>
                                      <div className={`h-2 rounded overflow-hidden ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                                        <div className={`h-full ${isDark ? 'bg-green-500' : 'bg-green-500'}`} style={{ width: `${(d.assets / maxVal) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-baseline mb-1.5">
                                        <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Liabilities</span>
                                        <span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>${(d.liabilities / 1000000).toFixed(2)}M</span>
                                      </div>
                                      <div className={`h-2 rounded overflow-hidden ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                                        <div className={`h-full ${isDark ? 'bg-red-500' : 'bg-red-500'}`} style={{ width: `${(d.liabilities / maxVal) * 100}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cash Flow Components */}
                      {financials.financial_fundamentals.visual_data.cash_flow_components && financials.financial_fundamentals.visual_data.cash_flow_components.length > 0 && (
                        <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Cash Flow Components</h4>
                          
                          {/* Line Chart Visualization */}
                          <div className="mb-6">
                            <div className="h-48 relative">
                              <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
                                {/* Grid lines */}
                                <g className="opacity-10">
                                  {[0, 1, 2, 3, 4].map((i) => (
                                    <line
                                      key={`grid-${i}`}
                                      x1="50"
                                      y1={i * 45}
                                      x2="600"
                                      y2={i * 45}
                                      stroke={isDark ? '#94a3b8' : '#cbd5e1'}
                                      strokeWidth="1"
                                    />
                                  ))}
                                </g>
                                
                                {/* Zero line */}
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.cash_flow_components;
                                  const allValues = data.flatMap((d: any) => [d.operating, d.investing, d.financing]);
                                  const maxVal = Math.max(...allValues);
                                  const minVal = Math.min(...allValues);
                                  const range = maxVal - minVal || 1;
                                  const zeroY = 180 - ((0 - minVal) / range) * 160 - 10;
                                  
                                  return (
                                    <line
                                      x1="50"
                                      y1={zeroY}
                                      x2="600"
                                      y2={zeroY}
                                      stroke={isDark ? '#475569' : '#cbd5e1'}
                                      strokeWidth="1"
                                      strokeDasharray="4 4"
                                    />
                                  );
                                })()}
                                
                                {/* Operating Cash Flow Line */}
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.cash_flow_components;
                                  const allValues = data.flatMap((d: any) => [d.operating, d.investing, d.financing]);
                                  const maxVal = Math.max(...allValues);
                                  const minVal = Math.min(...allValues);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = 50 + (i / (data.length - 1)) * 550;
                                    const y = 180 - ((d.operating - minVal) / range) * 160 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="#3b82f6"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  );
                                })()}
                                
                                {/* Investing Cash Flow Line */}
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.cash_flow_components;
                                  const allValues = data.flatMap((d: any) => [d.operating, d.investing, d.financing]);
                                  const maxVal = Math.max(...allValues);
                                  const minVal = Math.min(...allValues);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = 50 + (i / (data.length - 1)) * 550;
                                    const y = 180 - ((d.investing - minVal) / range) * 160 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="#ef4444"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  );
                                })()}
                                
                                {/* Financing Cash Flow Line */}
                                {(() => {
                                  const data = financials.financial_fundamentals.visual_data.cash_flow_components;
                                  const allValues = data.flatMap((d: any) => [d.operating, d.investing, d.financing]);
                                  const maxVal = Math.max(...allValues);
                                  const minVal = Math.min(...allValues);
                                  const range = maxVal - minVal || 1;
                                  
                                  const points = data.map((d: any, i: number) => {
                                    const x = 50 + (i / (data.length - 1)) * 550;
                                    const y = 180 - ((d.financing - minVal) / range) * 160 - 10;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  
                                  return (
                                    <polyline
                                      points={points}
                                      fill="none"
                                      stroke="#f59e0b"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  );
                                })()}
                              </svg>
                              
                              {/* Year labels */}
                              <div className="flex justify-between mt-2 pl-12">
                                {financials.financial_fundamentals.visual_data.cash_flow_components.map((d: any, i: number) => (
                                  <span key={i} className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {d.year}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Operating</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Investing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500" />
                              <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Financing</span>
                            </div>
                          </div>
                          
                          {/* Data Table */}
                          <div className="mt-6 space-y-3">
                            {financials.financial_fundamentals.visual_data.cash_flow_components.map((d: any, idx: number) => (
                              <div 
                                key={idx}
                                className={`flex items-center gap-6 pb-3 ${idx < financials.financial_fundamentals.visual_data.cash_flow_components.length - 1 ? (isDark ? 'border-b border-slate-700/50' : 'border-b border-slate-100') : ''}`}
                              >
                                <div className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} min-w-[60px]`}>{d.year}</div>
                                <div className="grid grid-cols-3 gap-4 text-center flex-1">
                                  <div>
                                    <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Operating</div>
                                    <div className={`text-sm font-bold text-blue-500`}>
                                      ${(d.operating / 1000000).toFixed(1)}M
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Investing</div>
                                    <div className={`text-sm font-bold ${d.investing < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      ${(d.investing / 1000000).toFixed(1)}M
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Financing</div>
                                    <div className={`text-sm font-bold ${d.financing < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                      ${(d.financing / 1000000).toFixed(1)}M
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trend Analysis */}
                  {financials.financial_fundamentals.trend_analysis && (
                    <div className="space-y-4 mt-6">
                      <h4 className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Trend Analysis</h4>
                      
                      {financials.financial_fundamentals.trend_analysis.profitability && (
                        <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-green-500' : 'bg-slate-50 border-l-green-400'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Profitability</h5>
                          <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.financial_fundamentals.trend_analysis.profitability}
                          </p>
                        </div>
                      )}

                      {financials.financial_fundamentals.trend_analysis.liquidity && (
                        <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-blue-500' : 'bg-slate-50 border-l-blue-400'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Liquidity</h5>
                          <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.financial_fundamentals.trend_analysis.liquidity}
                          </p>
                        </div>
                      )}

                      {financials.financial_fundamentals.trend_analysis.leverage && (
                        <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-purple-500' : 'bg-slate-50 border-l-purple-400'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Leverage</h5>
                          <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.financial_fundamentals.trend_analysis.leverage}
                          </p>
                        </div>
                      )}

                      {financials.financial_fundamentals.trend_analysis.cash_flow && (
                        <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-amber-500' : 'bg-slate-50 border-l-amber-400'}`}>
                          <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Cash Flow</h5>
                          <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.financial_fundamentals.trend_analysis.cash_flow}
                          </p>
                        </div>
                      )}

                      {financials.financial_fundamentals.trend_analysis.overall_commentary && (
                        <div className={`mt-6 p-6 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                          <h5 className={`text-base font-semibold mb-3 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Overall Commentary</h5>
                          <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            {financials.financial_fundamentals.trend_analysis.overall_commentary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fundamentals Insights & Recommendations */}
                  <div className="space-y-6 mt-6">
                    {financials.financial_fundamentals.insights && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Fundamental Insights</h3>
                        <SectionText data={financials.financial_fundamentals.insights} />
                      </div>
                    )}
                    {financials.financial_fundamentals.recommendations && (
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Fundamental Recommendations</h3>
                        <SectionText data={financials.financial_fundamentals.recommendations} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Analysis Section */}
              <div className="space-y-6">
                {financials.summary && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Summary</h3>
                    <SectionText data={financials.summary} />
                  </div>
                )}
                {financials.insights && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Insights</h3>
                    <SectionText data={financials.insights} />
                  </div>
                )}
                {financials.recommendations && (
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recommendations</h3>
                    <SectionText data={financials.recommendations} />
                  </div>
                )}
              </div>
            </div>
          ) : <p className="text-slate-400 italic text-sm">No financial data available.</p>}
        </SectionCard>

        {/* COMPANY INTELLIGENCE SECTION - MOVED LAST */}
        <SectionCard title="Company Intelligence">
          {companyIntelligence?.error ? (
            <p className="text-red-500 text-sm">Error: {companyIntelligence.error}</p>
          ) : companyIntelligence ? (
            <div className="space-y-6">
              {/* Company Overview & Key Info */}
              <DetailedInfoCard title="Company Overview">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className={`leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{companyIntelligence.company_overview?.overview || 'No overview available.'}</p>
                    {companyIntelligence.company_overview?.company_mission && (
                      <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-[color:var(--border-secondary)]' : 'bg-slate-50 border-slate-400'}`}>
                        <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Mission Statement</h4>
                        <p className={`whitespace-pre-line leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{companyIntelligence.company_overview.company_mission}</p>
                      </div>
                    )}
                  </div>

                  <div>
                     <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Key Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(['official_company_name', 'industry', 'headquarters', 'founding_date', 'number_of_employees', 'website'] as const).map(key => {
                        const value = companyIntelligence.company_overview?.[key];
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        if (!value) return null;
                        return (
                          <div key={key} className={`p-3 border rounded-lg ${isDark ? 'theme-muted theme-border' : 'bg-slate-50 border-slate-200'}`}>
                            <dt className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>{label}</dt>
                            <dd className={`mt-1 text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>
                              {key === 'website' && typeof value === 'string' ? 
                                <a href={value} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{value}</a> : 
                              key === 'industry' && typeof value === 'string' ?
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${isDark ? 'theme-card theme-text' : 'bg-slate-200 text-slate-700'}`}>{value}</span> :
                                String(value)
                              }
                            </dd>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </DetailedInfoCard>

              {/* Core Offerings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <DetailedInfoCard 
                  title="Unique Selling Points" 
                  items={companyIntelligence.company_overview?.unique_selling_points}
                  analysisText={companyIntelligence.company_overview?.unique_selling_points_analysis}
                  analysisTitle="USP Analysis"
                  analysisBaseColor="blue"
                />
                <DetailedInfoCard 
                  title="Products & Services" 
                  items={companyIntelligence.company_overview?.products_services}
                  analysisText={companyIntelligence.company_overview?.products_services_analysis}
                  analysisTitle="Product/Service Analysis"
                  analysisBaseColor="blue"
                />
              </div>
              
              <DetailedInfoCard 
                title="Main Competitors" 
                items={Array.isArray(companyIntelligence.company_overview?.main_competitors) ? companyIntelligence.company_overview.main_competitors : (companyIntelligence.company_overview?.main_competitors ? [companyIntelligence.company_overview.main_competitors] : [])} 
                analysisText={companyIntelligence.company_overview?.main_competitors_analysis}
                analysisTitle="Competitive Landscape"
                analysisBaseColor="blue"
              />
              
              <DetailedInfoCard 
                title="Geographical Presence" 
                analysisText={companyIntelligence.company_overview.locations_analysis}
                analysisTitle="Locations Analysis"
                analysisBaseColor="blue"
              >
                {/* Integrate Map Here - REMOVED */}
                {/* {companyIntelligence.graph_data?.market_presence && companyIntelligence.graph_data.market_presence.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Market Presence Map</h4>
                    <MarketPresenceMap data={companyIntelligence.graph_data.market_presence} />
                  </div>
                )} */}
              </DetailedInfoCard>

              <DetailedInfoCard title="Funding Rounds">
                {companyIntelligence.funding_rounds?.rounds?.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {companyIntelligence.funding_rounds.rounds.map((round: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-lg border ${isDark ? 'theme-muted theme-border' : 'bg-gray-50 border-gray-200'}`}>
                        <h5 className={`font-semibold text-base mb-1 ${isDark ? 'accent' : 'text-blue-700'}`}>{round.round_name || 'Round'} <span className={`text-xs font-normal ${isDark ? 'theme-text-muted' : 'text-gray-500'}`}>({round.date})</span></h5>
                        <p className={`text-xs ${isDark ? 'theme-text-secondary' : 'text-gray-600'}`}>Amount: {round.amount_raised || 'N/A'}</p>
                        <p className={`text-xs ${isDark ? 'theme-text-secondary' : 'text-gray-600'}`}>Investors: {round.number_of_investors ?? 'N/A'} {round.lead_investors?.length > 0 ? `(Lead: ${round.lead_investors.join(', ')})` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className={`italic mb-6 text-sm ${isDark ? 'theme-text-muted' : 'text-gray-500'}`}>No funding rounds listed.</p>}
                {companyIntelligence.funding_rounds?.total_funding_amount && (
                  <p className={`mb-4 text-sm ${isDark ? 'theme-text-secondary' : 'text-gray-700'}`}><strong>Total Funding:</strong> <span className="font-semibold">{companyIntelligence.funding_rounds.total_funding_amount}</span></p>
                )}
                {companyIntelligence.funding_rounds?.funding_commentary && 
                  <div className={`p-4 border-l-4 rounded-r-lg mb-4 ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                     <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Funding Commentary</h4>
                     <p className={`whitespace-pre-line leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{companyIntelligence.funding_rounds.funding_commentary}</p>
                  </div>
                }
                {companyIntelligence.funding_rounds?.funding_rounds_analysis && 
                  <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-[color:var(--border-secondary)]' : 'bg-slate-50 border-l-slate-400'}`}>
                     <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'theme-text' : 'text-slate-800'}`}>Detailed Funding Analysis</h4>
                     <p className={`whitespace-pre-line leading-relaxed text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{companyIntelligence.funding_rounds.funding_rounds_analysis}</p>
                  </div>
                }
              </DetailedInfoCard>
              
              <DetailedInfoCard 
                title="Key Investors" 
                items={companyIntelligence.investors?.map((inv: any) => typeof inv === 'string' ? inv : inv.name) || []} 
                itemClassName="text-sm"
              />

              {/* News & Press */}
              {/* Recent Market News Section */}
              {companyIntelligence.recent_market_news && (
                <DetailedInfoCard title="Recent Market News">
                  <div className="space-y-6">
                    {/* Market Sentiment Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Market Sentiment Index Gauge */}
                      {companyIntelligence.recent_market_news.market_sentiment_index != null && (
                        <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Market Sentiment Index</h4>
                          <div className="flex items-center justify-center">
                            <div className="relative w-32 h-32">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  stroke={isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(226, 232, 240, 1)'}
                                  strokeWidth="8"
                                  fill="none"
                                />
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  stroke={
                                    companyIntelligence.recent_market_news.market_sentiment_index >= 60
                                      ? '#10b981'
                                      : companyIntelligence.recent_market_news.market_sentiment_index >= 40
                                      ? '#f59e0b'
                                      : '#ef4444'
                                  }
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${(companyIntelligence.recent_market_news.market_sentiment_index / 100) * 351.86} 351.86`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-3xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                                  {Math.round(companyIntelligence.recent_market_news.market_sentiment_index)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center mt-4">
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-lg ${
                              companyIntelligence.recent_market_news.summary_sentiment === 'positive'
                                ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200')
                                : companyIntelligence.recent_market_news.summary_sentiment === 'negative'
                                ? (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200')
                                : (isDark ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-200')
                            }`}>
                              {companyIntelligence.recent_market_news.summary_sentiment?.charAt(0).toUpperCase() + companyIntelligence.recent_market_news.summary_sentiment?.slice(1) || 'Neutral'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Themes */}
                      {companyIntelligence.recent_market_news.themes && companyIntelligence.recent_market_news.themes.length > 0 && (
                        <div className={`p-6 border rounded-xl ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h4 className={`text-sm font-semibold mb-4 ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Key Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {companyIntelligence.recent_market_news.themes.map((theme: string, idx: number) => (
                              <span key={idx} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Key Events */}
                    {companyIntelligence.recent_market_news.key_events && companyIntelligence.recent_market_news.key_events.length > 0 && (
                      <div>
                        <h4 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Key Events</h4>
                        <KeyEventsSection events={companyIntelligence.recent_market_news.key_events} isDark={isDark} />
                      </div>
                    )}

                    {/* Analysis Sections */}
                    {companyIntelligence.recent_market_news.analysis && (
                      <div className="space-y-4">
                        <h4 className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Market Analysis</h4>
                        
                        {companyIntelligence.recent_market_news.analysis.market_impact && (
                          <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-blue-500' : 'bg-slate-50 border-l-blue-400'}`}>
                            <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Market Impact</h5>
                            <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                              {companyIntelligence.recent_market_news.analysis.market_impact}
                            </p>
                          </div>
                        )}

                        {companyIntelligence.recent_market_news.analysis.strategic_implications && (
                          <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-purple-500' : 'bg-slate-50 border-l-purple-400'}`}>
                            <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Strategic Implications</h5>
                            <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                              {companyIntelligence.recent_market_news.analysis.strategic_implications}
                            </p>
                          </div>
                        )}

                        {companyIntelligence.recent_market_news.analysis.investor_reaction && (
                          <div className={`p-4 border-l-4 rounded-r-lg ${isDark ? 'theme-muted border-l-amber-500' : 'bg-slate-50 border-l-amber-400'}`}>
                            <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Investor Reaction</h5>
                            <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                              {companyIntelligence.recent_market_news.analysis.investor_reaction}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk and Opportunity Signals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {companyIntelligence.recent_market_news.risk_signals && companyIntelligence.recent_market_news.risk_signals.length > 0 && (
                        <div className={`p-5 border rounded-xl border-l-4 border-l-red-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-3 ${isDark ? 'text-red-400' : 'text-red-700'}`}>Risk Signals</h5>
                          <div className="flex flex-wrap gap-2">
                            {companyIntelligence.recent_market_news.risk_signals.map((signal: string, idx: number) => (
                              <span key={idx} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {signal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {companyIntelligence.recent_market_news.opportunity_signals && companyIntelligence.recent_market_news.opportunity_signals.length > 0 && (
                        <div className={`p-5 border rounded-xl border-l-4 border-l-green-500 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                          <h5 className={`text-sm font-semibold mb-3 ${isDark ? 'text-green-400' : 'text-green-700'}`}>Opportunity Signals</h5>
                          <div className="flex flex-wrap gap-2">
                            {companyIntelligence.recent_market_news.opportunity_signals.map((signal: string, idx: number) => (
                              <span key={idx} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                                isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-700 border border-green-200'
                              }`}>
                                {signal}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DetailedInfoCard>
              )}

              {/* Team & Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                <DetailedInfoCard title="People">
                  <h4 className={`text-md font-semibold mb-3 mt-[-10px] ${isDark ? 'theme-text-secondary' : 'text-gray-700'}`}>Founders</h4>
                  {companyIntelligence.company_overview?.founders && companyIntelligence.company_overview.founders.length > 0 ? (
                     <ul className="space-y-2 mb-6">
                      {companyIntelligence.company_overview.founders.map((f: any, idx: number) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'theme-text-secondary' : 'text-gray-600'}`}>
                          <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'theme-text-muted' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                          <span>{typeof f === 'object' && f !== null && 'name' in f ? `${f.name}${f.role ? ` (${f.role})` : ''}` : String(f)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className={`italic text-sm mb-6 ${isDark ? 'theme-text-muted' : 'text-gray-500'}`}>No founders listed.</p>}
                  
                  <h4 className={`text-md font-semibold mb-3 ${isDark ? 'theme-text-secondary' : 'text-gray-700'}`}>Key Team Members</h4>
                   {companyIntelligence.company_overview?.key_team_members && companyIntelligence.company_overview.key_team_members.length > 0 ? (
                    <ul className="space-y-2">
                      {companyIntelligence.company_overview.key_team_members.map((m: any, idx: number) => (
                        <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'theme-text-secondary' : 'text-gray-600'}`}>
                           <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'theme-text-muted' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                          <span>{typeof m === 'object' && m !== null && 'name' in m ? `${m.name}${m.role ? ` (${m.role})` : ''}` : String(m)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className={`italic text-sm ${isDark ? 'theme-text-muted' : 'text-gray-500'}`}>No key team members listed.</p>}
                </DetailedInfoCard>
                
                <DetailedInfoCard title="Contact Information">
                  <ul className={`space-y-1 text-sm ${isDark ? 'theme-text-secondary' : 'text-gray-700'}`}>
                    <li><strong>Email:</strong> {companyIntelligence.contact_information?.email || 'N/A'}</li>
                    <li><strong>Phone:</strong> {companyIntelligence.contact_information?.phone || 'N/A'}</li>
                    <li><strong>Address:</strong> {companyIntelligence.contact_information?.address || 'N/A'}</li>
                    {companyIntelligence.contact_information?.other && Object.entries(companyIntelligence.contact_information.other).length > 0 && (
                        Object.entries(companyIntelligence.contact_information.other).map(([key, value]) => (
                            <li key={key}><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}</li>
                        ))
                    )}
                  </ul>
                </DetailedInfoCard>
              </div>
            </div>
          ) : <p className={`italic text-sm ${isDark ? 'theme-text-muted' : 'text-slate-400'}`}>No company intelligence data available.</p>}
        </SectionCard>
      </div>
    </main>
  );
};

export default ReportClient;