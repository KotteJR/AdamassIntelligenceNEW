'use client';

import React from 'react';
import { useTheme } from './ThemeToggle';

interface SwotItem {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

interface SwotSummary {
  overall_assessment: string;
  key_insights: string[];
  strategic_priorities: string[];
}

interface SwotData {
  company: string;
  generated: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  summary: SwotSummary;
  metadata?: {
    analysisScores?: {
      architecture?: number;
      security?: number;
      confidence?: number;
    };
    totalItems?: {
      strengths: number;
      weaknesses: number;
      opportunities: number;
      threats: number;
    };
  };
}

interface SwotAnalysisVisualizationProps {
  data: SwotData;
}

const SwotAnalysisVisualization: React.FC<SwotAnalysisVisualizationProps> = ({ data }) => {
  const { isDark } = useTheme();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return isDark ? 'bg-red-900/50 border-red-400 text-red-200' : 'bg-red-50 border-red-400 text-red-800';
      case 'high':
        return isDark ? 'bg-orange-900/50 border-orange-400 text-orange-200' : 'bg-orange-50 border-orange-400 text-orange-800';
      case 'medium':
        return isDark ? 'bg-yellow-900/50 border-yellow-400 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'low':
        return isDark ? 'bg-green-900/50 border-green-400 text-green-200' : 'bg-green-50 border-green-400 text-green-800';
      default:
        return isDark ? 'bg-slate-700 border-slate-500 text-slate-300' : 'bg-slate-50 border-slate-400 text-slate-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return isDark ? 'bg-blue-900/30 border-blue-400/50' : 'bg-blue-50 border-blue-200';
      case 'security':
        return isDark ? 'bg-purple-900/30 border-purple-400/50' : 'bg-purple-50 border-purple-200';
      case 'market':
        return isDark ? 'bg-green-900/30 border-green-400/50' : 'bg-green-50 border-green-200';
      case 'competitive':
        return isDark ? 'bg-red-900/30 border-red-400/50' : 'bg-red-50 border-red-200';
      case 'operational':
        return isDark ? 'bg-orange-900/30 border-orange-400/50' : 'bg-orange-50 border-orange-200';
      case 'financial':
        return isDark ? 'bg-emerald-900/30 border-emerald-400/50' : 'bg-emerald-50 border-emerald-200';
      default:
        return isDark ? 'bg-slate-700/50 border-slate-500' : 'bg-slate-50 border-slate-200';
    }
  };

  const SwotSection = ({ 
    title, 
    items, 
    headerBg, 
    icon 
  }: { 
    title: string; 
    items: SwotItem[]; 
    headerBg: string; 
    icon: React.ReactNode;
  }) => (
    <div className={`rounded-2xl border ${isDark ? 'theme-border theme-card' : 'bg-white border-slate-200'} overflow-hidden h-full flex flex-col`}> 
      <div className={`px-5 py-4 border-b ${isDark ? 'theme-border' : 'border-slate-200'} flex items-center gap-3 ${headerBg}`}>
        {icon}
        <h3 className={`text-base font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{title}</h3>
        <div className="ml-auto" />
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-xl border ${isDark ? 'theme-border theme-muted' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`font-medium text-sm ${isDark ? 'theme-text' : 'text-slate-900'}`}>{item.title}</h4>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${getImpactColor(item.impact)}`}>{item.impact}</span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{item.description}</p>
            <div className="mt-2">
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 theme-text-muted border border-white/10' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                SWOT Analysis
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {data.company} • Generated {new Date(data.generated).toLocaleDateString()}
              </p>
            </div>
            {data.metadata?.analysisScores && (
              <div className={`flex gap-4 p-3 rounded-lg ${isDark ? 'bg-slate-800/50 border border-slate-600' : 'bg-slate-50 border border-slate-200'}`}>
                {data.metadata.analysisScores.architecture && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {data.metadata.analysisScores.architecture}/10
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Architecture</div>
                  </div>
                )}
                {data.metadata.analysisScores.security && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {data.metadata.analysisScores.security}/10
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Security</div>
                  </div>
                )}
                {data.metadata.analysisScores.confidence && (
                  <div className="text-center">
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {data.metadata.analysisScores.confidence}/10
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Confidence</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SWOT Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <SwotSection
            title="Strengths"
            items={data.strengths}
            headerBg={isDark ? 'bg-green-400/10' : 'bg-green-50'}
            icon={
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
          />

          {/* Weaknesses */}
          <SwotSection
            title="Weaknesses"
            items={data.weaknesses}
            headerBg={isDark ? 'bg-red-400/10' : 'bg-red-50'}
            icon={
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />

          {/* Opportunities */}
          <SwotSection
            title="Opportunities"
            items={data.opportunities}
            headerBg={isDark ? 'bg-blue-400/10' : 'bg-blue-50'}
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
              </svg>
            }
          />

          {/* Threats */}
          <SwotSection
            title="Threats"
            items={data.threats}
            headerBg={isDark ? 'bg-yellow-400/10' : 'bg-yellow-50'}
            icon={
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 19a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            }
          />
        </div>

        {/* Summary Section */}
        {data.summary && (
          <div className={`rounded-2xl border p-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'} mb-6`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Strategic Summary
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Assessment */}
              <div>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Overall Assessment
                </h4>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {data.summary.overall_assessment}
                </p>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Key Insights
                </h4>
                <ul className="space-y-1">
                  {data.summary.key_insights.map((insight, index) => (
                    <li key={index} className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Priorities */}
              <div>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Strategic Priorities
                </h4>
                <ul className="space-y-1">
                  {data.summary.strategic_priorities.map((priority, index) => (
                    <li key={index} className={`text-sm flex items-start gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Bottom spacer to ensure comfortable scroll past last table */}
        <div className="h-10" />
      </div>
    </div>
  );
};

export default SwotAnalysisVisualization;
