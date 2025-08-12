"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import AddSourcesModal from "./components/AddSourcesModal";
import ThemeToggle, { useTheme } from "./components/ThemeToggle";
import AuthModal from "./components/AuthModal";
import { useUser } from "./contexts/UserContext";
import { supabase } from "../lib/supabaseClient";
import { generateCardBackground, getBackgroundStyle, getTextColor, getBadgeStyle } from "./utils/cardBackgrounds";
import { getProjectImage } from "./utils/cardImages";

interface StoredReportIndexItem {
  jobId: string;
  companyAlias: string;
  dateGenerated: string;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function SearchParamsHandler({ setIsAuthModalOpen }: { setIsAuthModalOpen: (open: boolean) => void }) {
  const searchParams = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    // if redirected with ?auth=1 and not logged in, open sign-in modal
    const wantsAuth = searchParams?.get("auth") === "1";
    if (wantsAuth && !user) {
      setIsAuthModalOpen(true);
    }
  }, [searchParams, user, setIsAuthModalOpen]);

  return null;
}

function HomeContent() {
  const router = useRouter();
  const { user, isLoading: userLoading, signOut } = useUser();
  const { isDark } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [allReports, setAllReports] = useState<StoredReportIndexItem[]>([]);
  const [userReports, setUserReports] = useState<StoredReportIndexItem[]>([]);
  const [myIds, setMyIds] = useState<string[]>([]);

  useEffect(() => {

    const loadAllReports = async () => {
      try {
        // Load featured analyses from local Storage folder
        const res = await fetch("/api/reports");
        if (!res.ok) return;
        const data = await res.json();
        const mapped: StoredReportIndexItem[] = (data || []).map((r: { jobId: string; companyAlias: string; dateGenerated: string }) => ({ 
          jobId: r.jobId, 
          companyAlias: r.companyAlias, 
          dateGenerated: r.dateGenerated 
        }));
        mapped.sort((a, b) => new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime());
        setAllReports(mapped);
      } catch {}
    };

    const loadUserReports = async () => {
      if (!user) {
        setUserReports([]);
        return;
      }

      try {
        // Load user-specific reports from Supabase
        const { data, error } = await supabase
          .from('user_analyses')
          .select('job_id, company_alias, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped: StoredReportIndexItem[] = (data || []).map(r => ({
          jobId: r.job_id,
          companyAlias: r.company_alias || 'Unknown Company',
          dateGenerated: r.created_at
        }));

        setUserReports(mapped);
      } catch (error) {
        console.error('Error loading user reports:', error);
      }
    };

    loadAllReports();
    loadUserReports();
  }, [user]);

  useEffect(() => {
    try {
      const mine = JSON.parse(localStorage.getItem("myReports") || "[]");
      setMyIds(Array.isArray(mine) ? mine : []);
    } catch {
      setMyIds([]);
    }
  }, []);

  const myReports = useMemo(() => allReports.filter(r => myIds.includes(r.jobId)), [allReports, myIds]);

  const openAnalysis = (jobId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (typeof window !== "undefined") localStorage.setItem("currentJobId", jobId);
    router.push("/report");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <main className={`min-h-screen ${isDark ? 'theme-bg' : 'theme-bg'}`}>
      <Suspense fallback={null}>
        <SearchParamsHandler setIsAuthModalOpen={setIsAuthModalOpen} />
      </Suspense>
      {/* Top bar */}
      <div className={`sticky top-0 z-20 border-b ${isDark ? 'theme-border' : 'theme-border'} ${isDark ? 'theme-bg' : 'theme-bg'} backdrop-blur`}>
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <img src="/logo/adamass.svg" alt="Adamass" className={`h-6 ${isDark ? 'brightness-0 invert' : ''}`} />
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                 <button 
                   onClick={() => user ? setIsModalOpen(true) : setIsAuthModalOpen(true)} 
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isDark 
                      ? 'btn-primary' 
                      : 'bg-slate-900 text-white hover:bg-black'
                  }`}
                >
                  + Create new
                </button>
                <ThemeToggle />
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsMenuOpen(v => !v)} className={`h-9 w-9 rounded-full overflow-hidden ring-1 align-middle ${isDark ? 'ring-[color:var(--border-primary)]' : 'ring-slate-200'}`}>
                    <img src={user.avatarUrl || '/avatars/a1.png'} alt="Profile" className="h-full w-full object-cover" />
                  </button>
                  {isMenuOpen && (
                    <div className={`absolute right-0 mt-2 w-40 rounded-xl border p-2 text-sm shadow-sm ${isDark ? 'theme-card theme-border' : 'border-slate-200 bg-white'}`}>
                      <div className={`px-2 py-1 font-medium truncate ${isDark ? 'theme-text' : 'text-slate-900'}`}>{user.name || user.email}</div>
                      <button onClick={() => { setIsMenuOpen(false); signOut(); }} className={`w-full text-left px-2 py-1 rounded-lg ${isDark ? 'hover:theme-muted theme-text-secondary' : 'hover:bg-slate-50'}`}>Sign out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`text-sm font-medium transition-colors ${isDark ? 'theme-text-secondary hover:accent' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Sign in
                </button>
                <button 
                  onClick={() => user ? setIsModalOpen(true) : setIsAuthModalOpen(true)} 
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isDark 
                      ? 'btn-primary' 
                      : 'bg-slate-900 text-white hover:bg-black'
                  }`}
                >
                  + Create new
                </button>
                <ThemeToggle />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Featured (global, horizontally scrollable) */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'theme-text-secondary'}`}>Featured Analyses</h2>
            <div className={`text-xs ${isDark ? 'theme-text-muted' : 'theme-text-muted'}`}>Most recent</div>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2">
            {allReports.map((r, idx) => {
              const background = generateCardBackground(r.companyAlias, r.jobId);
              const img = getProjectImage(r.companyAlias, r.jobId);
              const textColor = getTextColor(background);
              const badgeStyle = getBadgeStyle(background);
              
              return (
                <button
                  key={r.jobId}
                  onClick={() => openAnalysis(r.jobId)}
                  className={`snap-start w-64 h-50 shrink-0 rounded-xl p-4 text-left relative overflow-hidden animated-card ${background.gradient}`}
                  style={{
                    ...getBackgroundStyle(background),
                    // randomize hues/duration per card via CSS vars
                    ['--a1' as any]: `rgba(${(idx*53)%255}, ${(idx*97)%255}, ${(idx*29)%255}, 0.30)`,
                    ['--a2' as any]: `rgba(${(idx*79+120)%255}, ${(idx*41+80)%255}, ${(idx*23+160)%255}, 0.55)`,
                    ['--a3' as any]: `rgba(${(idx*33+200)%255}, ${(idx*61+60)%255}, ${(idx*17+120)%255}, 0.40)`,
                    ['--dur' as any]: `${8 - (idx%3)*2}s`,
                  } as React.CSSProperties}
                >
                  {/* Complex animated layers */}
                  <div className="bg-aurora" />
                  <div className="bg-sheen" />
                  <div className="bg-noise" />
                  {/* Low-opacity tint for readability */}
                  <div className="absolute inset-0 bg-black/30" />
                  
                  {/* Content */}
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
        </section>

        {/* Recent (user-based) */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>{user ? 'Your Recent Analyses' : 'Recent Analyses'}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Create new tile (requires auth) */}
            <button onClick={() => (user ? setIsModalOpen(true) : setIsAuthModalOpen(true))} className={`flex h-32 flex-col items-center justify-center rounded-xl border border-dashed ${isDark ? 'theme-border theme-card theme-text-secondary' : 'border-slate-300 bg-white text-slate-600'} shadow-sm transition hover:opacity-80`}>
              <span
                className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold ${
                  isDark
                    ? 'theme-muted theme-border accent'
                    : 'bg-slate-50 border-slate-300 text-[color:var(--accent)]'
                }`}
                aria-hidden="true"
              >
                +
              </span>
              <span className="text-sm">Create new analysis</span>
            </button>

            {(user ? userReports : myReports).map((r) => {
              const background = generateCardBackground(r.companyAlias, r.jobId);
              const textColor = getTextColor(background);
              const badgeStyle = getBadgeStyle(background);
              const img = getProjectImage(r.companyAlias, r.jobId);
              
              return (
                <button 
                  key={r.jobId} 
                  onClick={() => openAnalysis(r.jobId)} 
                  className={`group h-32 rounded-xl p-3 text-left relative overflow-hidden`}
                  style={getBackgroundStyle(background)}
                >
                  {/* Image layer */}
                  <img src={img.imageUrl} alt={img.alt} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).src = img.fallbackUrl; }} className="absolute inset-0 h-full w-full object-cover" />
                  
                   {/* Dark overlay for better text readability (lighter) */}
                   <div className="absolute inset-0 bg-black/25" />
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className={`truncate text-sm font-semibold ${textColor}`}>
                        {r.companyAlias}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
                        Report
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className={`text-xs ${textColor} opacity-90`}>
                        Generated {new Date(r.dateGenerated).toLocaleDateString()}
                      </div>
                      <div className={`text-xs ${textColor} opacity-75`}>
                        Click to view analysis
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {(user ? userReports : myReports).length === 0 && (
              <div className={`col-span-full rounded-xl border p-4 text-sm ${isDark ? 'theme-border theme-card theme-text-secondary' : 'border-slate-200 bg-white text-slate-600'}`}>
                {user ? 'No analyses yet. Create your first one!' : 'No recent analyses yet. Create one to see it here.'}
              </div>
            )}
          </div>
        </section>
      </div>

      <AddSourcesModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={(jid) => openAnalysis(jid)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          // User context will automatically update
          setIsAuthModalOpen(false);
        }}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
