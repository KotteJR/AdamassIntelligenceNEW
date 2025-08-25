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
    bgColor, 
    borderColor, 
    icon 
  }: { 
    title: string; 
    items: SwotItem[]; 
    bgColor: string; 
    borderColor: string; 
    icon: React.ReactNode;
  }) => (
    <div className={`rounded-xl border-2 ${bgColor} ${borderColor} p-4 h-full`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-slate-700'}`}>
          {items.length} items
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${getCategoryColor(item.category)} ${isDark ? 'bg-black/20' : 'bg-white/50'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {item.title}
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(item.impact)}`}>
                {item.impact}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {item.description}
            </p>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-black/5 text-slate-500'}`}>
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
            bgColor={isDark ? 'bg-green-900/20' : 'bg-green-50'}
            borderColor={isDark ? 'border-green-500/50' : 'border-green-300'}
            icon={
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />

          {/* Weaknesses */}
          <SwotSection
            title="Weaknesses"
            items={data.weaknesses}
            bgColor={isDark ? 'bg-red-900/20' : 'bg-red-50'}
            borderColor={isDark ? 'border-red-500/50' : 'border-red-300'}
            icon={
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            }
          />

          {/* Opportunities */}
          <SwotSection
            title="Opportunities"
            items={data.opportunities}
            bgColor={isDark ? 'bg-blue-900/20' : 'bg-blue-50'}
            borderColor={isDark ? 'border-blue-500/50' : 'border-blue-300'}
            icon={
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Threats */}
          <SwotSection
            title="Threats"
            items={data.threats}
            bgColor={isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}
            borderColor={isDark ? 'border-yellow-500/50' : 'border-yellow-300'}
            icon={
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Summary Section */}
        {data.summary && (
          <div className={`rounded-xl border-2 p-6 ${isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-white border-slate-200'}`}>
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
      </div>
    </div>
  );
};

export default SwotAnalysisVisualization;
