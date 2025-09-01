"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "./ThemeToggle";
import { generateCardBackground, getBackgroundStyle, getTextColor, getBadgeStyle } from "../utils/cardBackgrounds";
import { getProjectImage } from "../utils/cardImages";

export type ReportIndexItem = {
  jobId: string;
  companyAlias: string;
  dateGenerated: string;
};

export default function BrowseReportsModal({
  open,
  onClose,
  reports,
  onOpenReport,
}: {
  open: boolean;
  onClose: () => void;
  reports: ReportIndexItem[];
  onOpenReport: (jobId: string) => void;
}) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [visibleRows, setVisibleRows] = useState(3); // 3 rows initially

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSortOrder("newest");
      setVisibleRows(3);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = reports.filter(r => !q || r.companyAlias.toLowerCase().includes(q));
    items = items.sort((a, b) => {
      const at = new Date(a.dateGenerated).getTime();
      const bt = new Date(b.dateGenerated).getTime();
      return sortOrder === 'newest' ? bt - at : at - bt;
    });
    return items;
  }, [reports, query, sortOrder]);

  const pageSize = 3 * visibleRows; // 3 columns x rows
  const page = filtered.slice(0, pageSize);
  const canSeeMore = page.length < filtered.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className={`w-[1100px] max-w-[98vw] overflow-hidden rounded-2xl ${isDark ? 'theme-card' : 'bg-white'} ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'} min-h-[640px] max-h-[85vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${isDark ? 'theme-border' : 'border-slate-200'} px-6 py-4`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Featured analyses</p>
            <h2 className={`text-xl font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>Browse all</h2>
          </div>
          <button onClick={onClose} className={`rounded-full p-2 ${isDark ? 'theme-text-muted hover:theme-muted' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies..."
            className={`h-9 w-full max-w-sm rounded-lg border px-3 text-sm ${isDark ? 'theme-border theme-card theme-text placeholder:theme-text-muted' : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400'}`}
          />
          <div className={`inline-flex items-center rounded-lg border overflow-hidden ${isDark ? 'theme-border theme-card' : 'border-slate-300 bg-white'}`} role="group" aria-label="Sort order">
            <button
              type="button"
              onClick={() => setSortOrder('newest')}
              className={`h-9 px-3 text-sm font-medium transition-colors ${sortOrder==='newest' ? (isDark ? 'btn-primary' : 'bg-slate-900 text-white') : (isDark ? 'theme-text-secondary hover:theme-muted' : 'text-slate-700 hover:bg-slate-50')}`}
            >
              Newest
            </button>
            <div className={`${isDark ? 'border-l theme-border' : 'border-l border-slate-200'} h-9`} />
            <button
              type="button"
              onClick={() => setSortOrder('oldest')}
              className={`h-9 px-3 text-sm font-medium transition-colors ${sortOrder==='oldest' ? (isDark ? 'btn-primary' : 'bg-slate-900 text-white') : (isDark ? 'theme-text-secondary hover:theme-muted' : 'text-slate-700 hover:bg-slate-50')}`}
            >
              Oldest
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="px-6 pb-5 flex-1 overflow-y-auto">
          {page.length === 0 ? (
            <div className={`rounded-xl border p-6 text-sm text-center ${isDark ? 'theme-border theme-card theme-text-secondary' : 'border-slate-200 bg-white text-slate-600'}`}>
              No analyses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.map((r, idx) => {
                const background = generateCardBackground(r.companyAlias, r.jobId);
                const textColor = getTextColor(background);
                const badgeStyle = getBadgeStyle(background);
                const img = getProjectImage(r.companyAlias, r.jobId);
                return (
                  <button
                    key={r.jobId}
                    onClick={() => onOpenReport(r.jobId)}
                    className={`group h-32 rounded-xl p-3 text-left relative overflow-hidden animated-card ${background.gradient}`}
                    style={{
                      ...getBackgroundStyle(background),
                      ['--a1' as any]: `rgba(${(idx*53)%255}, ${(idx*97)%255}, ${(idx*29)%255}, 0.30)`,
                      ['--a2' as any]: `rgba(${(idx*79+120)%255}, ${(idx*41+80)%255}, ${(idx*23+160)%255}, 0.55)`,
                      ['--a3' as any]: `rgba(${(idx*33+200)%255}, ${(idx*61+60)%255}, ${(idx*17+120)%255}, 0.40)`,
                      ['--dur' as any]: `${8 - (idx%3)*2}s`,
                    } as React.CSSProperties}
                  >
                    <div className="bg-aurora" />
                    <div className="bg-sheen" />
                    <div className="bg-noise" />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className={`truncate text-sm font-semibold ${textColor} dark:text-white`}>
                          {r.companyAlias}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
                          Report
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className={`text-xs ${textColor} opacity-90 dark:text-slate-200`}>
                          Generated {new Date(r.dateGenerated).toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${textColor} opacity-75 dark:text-slate-300`}>
                          Click to view analysis
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* See more */}
          {canSeeMore && (
            <div className="flex justify-center mt-5">
              <button
                onClick={() => setVisibleRows(v => v + 3)}
                className={`rounded-lg px-4 py-2 text-sm font-medium select-none ${
                  isDark 
                    ? 'theme-muted theme-text-muted' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                See more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


