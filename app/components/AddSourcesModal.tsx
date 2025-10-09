"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../../lib/supabaseClient";
import { UploadCloud, X, FileText, Plus, Minus, ChevronDown } from "lucide-react";
import { useTheme } from "./ThemeToggle";

export interface SourceFormValues {
  companyAlias: string;
  legalAlias: string;
  websiteUrl: string;
  countryOfIncorporation: string;
  preferredHostUrl?: string;
  openApiUrl?: string;
  repositoryUrls?: string[];
  isPublicCompany?: boolean;
  tickerSymbol?: string;
  files: File[];
}

export default function AddSourcesModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (jobId: string, companyAlias: string) => void;
}) {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [companyAlias, setCompanyAlias] = useState("");
  const [legalAlias, setLegalAlias] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [preferredHostUrl, setPreferredHostUrl] = useState("");
  const [countryOfIncorporation, setCountryOfIncorporation] = useState("");
  const [openApiUrl, setOpenApiUrl] = useState("");
  const [repositoryUrls, setRepositoryUrls] = useState<string[]>([""]);
  const [isPublicCompany, setIsPublicCompany] = useState(false);
  const [tickerSymbol, setTickerSymbol] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [isAborted, setIsAborted] = useState(false);
  const abortedRef = useRef(false);

  // Suggestion options for datalists
  const [companyAliasOptions, setCompanyAliasOptions] = useState<string[]>([]);
  const [legalAliasOptions, setLegalAliasOptions] = useState<string[]>([]);
  const [websiteUrlOptions, setWebsiteUrlOptions] = useState<string[]>([]);
  const [preferredHostOptions, setPreferredHostOptions] = useState<string[]>([]);
  const [openApiOptions, setOpenApiOptions] = useState<string[]>([]);
  const [repoUrlOptions, setRepoUrlOptions] = useState<string[]>([]);

  // Accordion active section (null means all closed)
  const [activeSection, setActiveSection] = useState<'company' | 'web' | 'api' | null>('company');
  const toggleSection = (section: 'company' | 'web' | 'api') => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  // Refs for smooth height animation
  const companyRef = useRef<HTMLDivElement>(null);
  const webRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!open) {
      setCompanyAlias("");
      setLegalAlias("");
      setWebsiteUrl("");
      setPreferredHostUrl("");
      setCountryOfIncorporation("");
      setOpenApiUrl("");
      setRepositoryUrls([""]); 
      setIsPublicCompany(false);
      setTickerSymbol("");
      setFiles([]);
      setIsProcessing(false);
          setIsCancelling(false);
    setIsAborted(false);
    setIsCompleted(false);
    abortedRef.current = false;
      setLogs([]);
      setJobId(null);
    }
  }, [open]);

  // Load suggestions from previous analyses for dropdowns
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('user_analyses')
          .select('company_alias, legal_alias, website_url, country_of_incorporation, report_data')
          .eq('user_id', user?.id || '')
          .limit(50);
        if (error || !data) return;
        const aliasSet = new Set<string>();
        const legalSet = new Set<string>();
        const websiteSet = new Set<string>();
        const preferredSet = new Set<string>();
        const openapiSet = new Set<string>();
        const repoSet = new Set<string>();

        for (const row of data as any[]) {
          if (row.company_alias) aliasSet.add(row.company_alias);
          if (row.legal_alias) legalSet.add(row.legal_alias);
          if (row.website_url) websiteSet.add(row.website_url);
          // Try to surface any URLs that might be embedded in report_data
          // without strict assumptions; best-effort extraction
          const report = row.report_data;
          if (report && typeof report === 'object') {
            const possibleUrls: string[] = [];
            const traverse = (obj: any) => {
              if (!obj) return;
              if (typeof obj === 'string') {
                possibleUrls.push(obj);
              } else if (Array.isArray(obj)) {
                for (const it of obj) traverse(it);
              } else if (typeof obj === 'object') {
                for (const key of Object.keys(obj)) traverse(obj[key]);
              }
            };
            traverse(report);
            for (const u of possibleUrls) {
              if (typeof u === 'string' && /^https?:\/\//i.test(u)) {
                if (/openapi|swagger|\.json|\.yaml|\.yml/i.test(u)) openapiSet.add(u);
                if (/app\.|dashboard\.|portal\.|host|app\//i.test(u)) preferredSet.add(u);
                if (/github\.com\//i.test(u)) repoSet.add(u);
              }
            }
          }
        }

        setCompanyAliasOptions(Array.from(aliasSet));
        setLegalAliasOptions(Array.from(legalSet));
        setWebsiteUrlOptions(Array.from(websiteSet));
        setPreferredHostOptions(Array.from(preferredSet));
        setOpenApiOptions(Array.from(openapiSet));
        setRepoUrlOptions(Array.from(repoSet));
      } catch {
        // silently ignore
      }
    };
    if (open) loadSuggestions();
  }, [open, user?.id]);

  if (!open) return null;

  const addLog = (s: string) => setLogs((prev) => [...prev, s]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const handleAddRepoUrl = () => {
    setRepositoryUrls((prev) => [...prev, ""]);
  };

  const handleRepoChange = (index: number, value: string) => {
    setRepositoryUrls((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleRemoveRepo = (index: number) => {
    setRepositoryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelAnalysis = async () => {
    if (!jobId) return;
    
    setIsCancelling(true);
    addLog(`Cancelling analysis...`);
    
    try {
      const response = await fetch("/api/cancel-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        addLog(`Analysis cancelled successfully.`);
        setIsAborted(true);
        abortedRef.current = true;
        setIsProcessing(false);
      } else {
        addLog(`Failed to cancel analysis: ${result.error || result.details}`);
      }
    } catch (error) {
      addLog(`Error cancelling analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const startAnalysis = async () => {
    if (!companyAlias || !websiteUrl) {
      addLog("Company alias and website URL are required.");
      return;
    }
    // Duplicate check (exact + OpenAI fuzzy). Block creation if match found.
    try {
      const dupRes = await fetch('/api/check-duplicate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyAlias, legalAlias })
      });
      const dupJson = await dupRes.json();
      if (dupRes.ok && dupJson.duplicate && dupJson.match?.jobId) {
        addLog(`Existing analysis found for ${companyAlias}. Opening existing report...`);
        if (typeof window !== 'undefined') localStorage.setItem('currentJobId', dupJson.match.jobId);
        onComplete(dupJson.match.jobId, dupJson.match.company || companyAlias);
        return;
      }
    } catch (e) {
      // Non-blocking on duplicate check failure
      addLog('Duplicate check unavailable, proceeding...');
    }
    const newJob = uuidv4();
    setJobId(newJob);
    setIsProcessing(true);
    setIsAborted(false);
    abortedRef.current = false;
    setLogs([`Initializing analysis for ${companyAlias} (Job ID: ${newJob})`]);

    try {
      // 0. Optionally ingest uploaded files as user documents
      if (files.length > 0) {
        addLog(`Processing ${files.length} uploaded file(s)...`);
        const readAsText = (file: File) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });

        const documents = [] as { filename: string; mimeType?: string; text: string }[];
        for (const f of files) {
          try {
            const text = await readAsText(f);
            if (text && text.trim()) {
              documents.push({ filename: f.name, mimeType: f.type, text });
            } else {
              addLog(`Skipped empty text for ${f.name}`);
            }
          } catch (e) {
            addLog(`Failed to read ${f.name} as text; skipping.`);
          }
        }

        if (documents.length > 0) {
          addLog(`Uploading ${documents.length} text document(s) to analysis...`);
          const ingestRes = await fetch('/api/ingest-user-docs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: newJob, documents })
          });
          const ingestJson = await ingestRes.json();
          if (!ingestRes.ok) {
            addLog(`Warning: Failed to upload documents: ${ingestJson.error || ingestJson.details || 'Unknown error'}`);
          } else {
            addLog(`Uploaded ${ingestJson.saved || documents.length} document(s) for inclusion.`);
          }
        } else {
          addLog('No readable text extracted from files; continuing without uploads.');
        }
      }

      addLog("Triggering workflow...");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || '';
      const initResponse = await fetch("/api/initiate-analysis", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: (() => {
          const base: any = {
            companyAlias,
            legalAlias,
            websiteUrl,
            countryOfIncorporation,
            jobId: newJob,
          };
          if (preferredHostUrl) base.preferredHostUrl = preferredHostUrl;
          if (openApiUrl) base.openApiUrl = openApiUrl;
          const cleanedRepos = repositoryUrls.map((u) => u.trim()).filter((u) => u);
          if (cleanedRepos.length > 0) base.repositoryUrls = cleanedRepos;
          if (isPublicCompany) base.isPublicCompany = true;
          if (isPublicCompany && tickerSymbol.trim()) base.tickerSymbol = tickerSymbol.trim();
          return JSON.stringify(base);
        })(),
      });
      const initJson = await initResponse.json();
      if (!initResponse.ok) {
        // Auth required
        if (initResponse.status === 401) {
          setIsProcessing(false);
          setIsAborted(true);
          addLog("Authentication required. Please sign in.");
          onClose();
          // open sign-in via parent (kept simple here)
          throw new Error("Authentication required.");
        }
        // Limit reached => route to subscription
        if (initResponse.status === 402 && initJson?.redirect) {
          addLog(initJson?.reason || "Usage limit reached");
          setIsProcessing(false);
          setIsAborted(true);
          onClose();
          if (typeof window !== 'undefined') window.location.href = initJson.redirect;
          return;
        }
        const errorMsg = initJson.error || "Failed to initiate analysis";
        const details = initJson.details ? ` Details: ${initJson.details}` : "";
        const troubleshooting = initJson.troubleshooting ? ` Troubleshooting: ${initJson.troubleshooting}` : "";
        throw new Error(`${errorMsg}${details}${troubleshooting}`);
      }
      addLog("Workflow triggered. Waiting for sources...");

      let isComplete = false;
      let pollCount = 0;
      const maxPolls = 50; // Maximum 6-7 minutes of polling
      
      while (!isComplete && !abortedRef.current && pollCount < maxPolls) {
        await new Promise((r) => setTimeout(r, 8000));
        pollCount++;
        
        // Check if analysis was cancelled using ref (this will see the latest value)
        if (abortedRef.current) {
          addLog("Analysis was cancelled.");
          return;
        }
        
        const statusRes = await fetch(`/api/check-job-status?jobId=${newJob}`);
        const statusJson = await statusRes.json();
        if (!statusRes.ok) {
          addLog(`Status error: ${statusJson.error || statusJson.details}`);
          continue;
        }
        const completed = Object.values(statusJson.sourceStatuses || {}).filter((s) => s === "done" || s === "completed").length as number;
        const total = statusJson.sourceStatuses ? Object.keys(statusJson.sourceStatuses).length : 0;
        addLog(`Status: ${completed}/${total} data sources ready...`);
        isComplete = Boolean(statusJson.isComplete);
        
        // Fallback: If all sources are done but isComplete is still false, 
        // check if we can already process the report
        if (!isComplete && completed === total && total === 8) {
          addLog("All sources completed, attempting to process report...");
          isComplete = true; // Force completion since all sources are done
        }
      }
      
      // Check if we timed out
      if (pollCount >= maxPolls) {
        addLog("Analysis timed out waiting for completion. Attempting to process available data...");
        // Don't throw error, try to process what we have
      }
      
      // If cancelled during processing, exit early
      if (abortedRef.current) {
        addLog("Analysis was cancelled.");
        return;
      }

      addLog("All sources ready. Generating structured report...");
      console.log(`[AddSourcesModal] Starting report processing for jobId: ${newJob}`);
      const processRes = await fetch("/api/process-report-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJob }),
      });
      console.log(`[AddSourcesModal] Report processing response status: ${processRes.status}`);
      const processJson = await processRes.json();
      if (!processRes.ok) {
        console.error(`[AddSourcesModal] Report processing failed:`, processJson);
        throw new Error(processJson.details || processJson.error || "Failed to process report");
      }
      console.log(`[AddSourcesModal] Report processing completed successfully`);
      addLog("Report generation completed. Saving...");

      const finalReportToSave = {
        jobId: newJob,
        companyAlias,
        dateGenerated: new Date().toISOString(),
        ...processJson,
      };

      // Save to Storage folder (local/Vercel) and Supabase Storage bucket
      try {
        const saveRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalReportToSave),
        });
        if (!saveRes.ok) {
          const saveError = await saveRes.json();
          console.warn('[AddSourcesModal] Warning: Failed to save to storage:', saveError);
          addLog("Warning: Storage save failed, continuing...");
        } else {
          console.log('[AddSourcesModal] Successfully saved to storage');
          addLog("Report saved to storage successfully.");
        }
      } catch (saveError) {
        console.warn('[AddSourcesModal] Error saving to storage:', saveError);
        addLog("Warning: Storage save failed, continuing...");
        // Don't throw, continue with database save
      }

      // CRITICAL: Ensure completion state is set regardless of save operations
      console.log(`[AddSourcesModal] Report processing completed, ensuring completion state...`);
      
      // Set completion state FIRST before any save operations
      addLog("Report complete. Opening analysis view...");
      console.log(`[AddSourcesModal] Setting completion state for jobId: ${newJob}`);
      setIsCompleted(true);

      // Always try to save to Supabase user_analyses for both logged in and anonymous users
      console.log(`[AddSourcesModal] Saving analysis for user: ${user?.id || 'anonymous'}, jobId: ${newJob}`);
      try {
        const { error } = await supabase
          .from('user_analyses')
          .insert([
            {
              user_id: user?.id || null, // Allow null for anonymous users
              job_id: newJob,
              company_alias: companyAlias,
              legal_alias: legalAlias,
              website_url: websiteUrl,
              country_of_incorporation: countryOfIncorporation,
              report_data: processJson
            }
          ]);

        if (error) {
          console.error('Error saving to user_analyses:', error);
          addLog("Warning: Database save failed, but report is ready.");
        } else {
          console.log('Successfully saved to user_analyses');
          addLog("Report saved to database successfully.");
        }
      } catch (error) {
        console.error('Failed to save to user_analyses:', error);
        addLog("Warning: Database save failed, but report is ready.");
      }

      // Keep localStorage for backward compatibility with existing reports
      try {
        const key = "myReports";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const updated = Array.isArray(existing) ? Array.from(new Set([...existing, newJob])) : [newJob];
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}

      if (typeof window !== "undefined") localStorage.setItem("currentJobId", newJob);
      
      // Auto-redirect after showing completion state
      setTimeout(() => {
        console.log(`[AddSourcesModal] Calling onComplete for jobId: ${newJob}`);
        onComplete(newJob, companyAlias);
      }, 3000); // 3 seconds to see the "Access Report" button
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canStart = companyAlias.trim() !== "" && websiteUrl.trim() !== "" && !isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className={`w-[1100px] max-w-[98vw] max-h-[90vh] overflow-hidden rounded-2xl mx-3 my-6 md:my-10 flex flex-col ${isDark ? 'theme-card' : 'bg-white'} ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${isDark ? 'theme-border' : 'border-slate-200'} px-6 py-6`}>
          <div>
            <p className={`text-[18px] font-semibold uppercase tracking-wide ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Start a new analysis</p>
            <h2 className={`text-md font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>Provide the necessary details to initiate the analysis.</h2>
          </div>
          <button onClick={onClose} className={`rounded-full p-2 ${isDark ? 'theme-text-muted hover:theme-muted' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 min-h-0 overflow-y-auto">
          {/* Left: form */}
          <form className="space-y-5 px-6 py-6 pb-8">
            {/* Section 1: Company & Identity */}
            <div className={`rounded-xl ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'} overflow-hidden`}>
              <button
                type="button"
                onClick={() => toggleSection('company')}
                className={`flex w-full items-center justify-between px-4 py-3 ${isDark ? 'theme-card theme-text' : 'bg-white text-slate-800'}`}
              >
                <span className="text-sm font-semibold">Company & Identity</span>
                <ChevronDown className={`transition-transform ${activeSection === 'company' ? 'rotate-180' : ''}`} size={18} />
              </button>
              <div className={`${isDark ? 'theme-card' : 'bg-white'} px-4`}>
                <div
                  ref={companyRef}
                  style={{
                    height: activeSection === 'company' ? companyRef.current?.scrollHeight : 0,
                    transition: 'height 250ms ease-in-out, opacity 550ms ease-in-out',
                    opacity: activeSection === 'company' ? 1 : 0,
                    overflow: 'hidden'
                  }}
                  aria-hidden={activeSection !== 'company'}
                >
                  <div className="space-y-4 pt-1 pb-4">
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Company alias</label>
                    <input
                      value={companyAlias}
                      onChange={(e) => setCompanyAlias(e.target.value)}
                      placeholder="e.g. Apple"
                      list="companyAliasOptions"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                      required
                    />
                    <datalist id="companyAliasOptions">
                      {companyAliasOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                    </div>
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Legal alias</label>
                    <input
                      value={legalAlias}
                      onChange={(e) => setLegalAlias(e.target.value)}
                      placeholder="e.g. Apple Inc."
                      list="legalAliasOptions"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                    />
                    <datalist id="legalAliasOptions">
                      {legalAliasOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                    </div>
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Ticker symbol</label>
                    <div className="flex items-center gap-3">
                      <input
                        value={tickerSymbol}
                        onChange={(e) => setTickerSymbol(e.target.value)}
                        placeholder="e.g. AAPL"
                        disabled={!isPublicCompany}
                        className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 disabled:opacity-50`}
                      />
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isPublicCompany}
                          onChange={(e) => setIsPublicCompany(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Public</span>
                      </label>
                    </div>
                    </div>
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Country of incorporation</label>
                    <input
                      value={countryOfIncorporation}
                      onChange={(e) => setCountryOfIncorporation(e.target.value)}
                      placeholder="e.g. Ireland, USA"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                    />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Websites */}
            <div className={`rounded-xl ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'} overflow-hidden`}>
              <button
                type="button"
                onClick={() => toggleSection('web')}
                className={`flex w-full items-center justify-between px-4 py-3 ${isDark ? 'theme-card theme-text' : 'bg-white text-slate-800'}`}
              >
                <span className="text-sm font-semibold">Web presence</span>
                <ChevronDown className={`transition-transform ${activeSection === 'web' ? 'rotate-180' : ''}`} size={18} />
              </button>
              <div className={`${isDark ? 'theme-card' : 'bg-white'} px-4`}>
                <div
                  ref={webRef}
                  style={{
                    height: activeSection === 'web' ? webRef.current?.scrollHeight : 0,
                    transition: 'height 250ms ease-in-out, opacity 500ms ease-in-out',
                    opacity: activeSection === 'web' ? 1 : 0,
                    overflow: 'hidden'
                  }}
                  aria-hidden={activeSection !== 'web'}
                >
                  <div className="space-y-4 pt-1 pb-4">
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Website URL (primary site)</label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://www.apple.com"
                      list="websiteUrlOptions"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                      required
                    />
                    <datalist id="websiteUrlOptions">
                      {websiteUrlOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                    </div>
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Preferred Host / Application URL (optional)</label>
                    <input
                      type="url"
                      value={preferredHostUrl}
                      onChange={(e) => setPreferredHostUrl(e.target.value)}
                      placeholder="https://app.example.com"
                      list="preferredHostOptions"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                    />
                    <datalist id="preferredHostOptions">
                      {preferredHostOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: API & Repositories */}
            <div className={`rounded-xl ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'} overflow-hidden`}>
              <button
                type="button"
                onClick={() => toggleSection('api')}
                className={`flex w-full items-center justify-between px-4 py-3 ${isDark ? 'theme-card theme-text' : 'bg-white text-slate-800'}`}
              >
                <span className="text-sm font-semibold">API & Repositories</span>
                <ChevronDown className={`transition-transform ${activeSection === 'api' ? 'rotate-180' : ''}`} size={18} />
              </button>
              <div className={`${isDark ? 'theme-card' : 'bg-white'} px-4`}>
                <div
                  ref={apiRef}
                  style={{
                    height: activeSection === 'api' ? apiRef.current?.scrollHeight : 0,
                    transition: 'height 250ms ease-in-out, opacity 500ms ease-in-out',
                    opacity: activeSection === 'api' ? 1 : 0,
                    overflow: 'hidden'
                  }}
                  aria-hidden={activeSection !== 'api'}
                >
                  <div className="space-y-4 pt-1 pb-4">
                    <div>
                    <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>OpenAPI URL (optional)</label>
                    <input
                      type="url"
                      value={openApiUrl}
                      onChange={(e) => setOpenApiUrl(e.target.value)}
                      placeholder="https://api.example.com/openapi.json"
                      list="openApiOptions"
                      className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                    />
                    <datalist id="openApiOptions">
                      {openApiOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                    </div>
                    <div>
                    <div className="flex items-center justify-between">
                      <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Repository URL(s) (optional)</label>
                      <button
                        type="button"
                        onClick={handleAddRepoUrl}
                        className={`inline-flex items-center gap-1 rounded-md border ${isDark ? 'theme-border theme-card theme-text hover:theme-muted' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} px-2 py-1 text-xs`}
                      >
                        <Plus size={14} /> Add URL
                      </button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {repositoryUrls.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleRepoChange(idx, e.target.value)}
                            placeholder="https://github.com/org/repo"
                            list="repoUrlOptions"
                            className={`flex-1 rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                          />
                          {repositoryUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRepo(idx)}
                              className={`inline-flex items-center gap-1 rounded-md border ${isDark ? 'theme-border theme-card theme-text hover:theme-muted' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} px-2 py-2`}
                              aria-label="Remove URL"
                            >
                              <Minus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <datalist id="repoUrlOptions">
                        {repoUrlOptions.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropzone-style uploader */}
            <div className={`rounded-xl border border-dashed ${isDark ? 'theme-border theme-muted' : 'border-slate-300 bg-slate-50'} p-5`}>
              <p className={`mb-2 text-sm font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Upload other sources (optional)</p>
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${isDark ? 'theme-border theme-card theme-text hover:theme-muted' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} px-4 py-2 text-sm font-medium`}>
                <UploadCloud size={18} />
                <span>Choose Files</span>
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
              </label>
              {files.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {files.map((f) => (
                    <li key={f.name} className={`inline-flex items-center gap-1 rounded-md ${isDark ? 'theme-card theme-text theme-border border' : 'bg-white text-slate-700 ring-1 ring-slate-200'} px-2 py-1 text-xs`}>
                      <FileText size={14} /> {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-1">
              {!isProcessing ? (
                <>
                  <button type="button" onClick={onClose} className={`rounded-lg border ${isDark ? 'theme-border theme-card theme-text hover:theme-muted' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} px-4 py-2 text-sm font-medium`}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startAnalysis}
                    disabled={!canStart}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${canStart ? (isDark ? 'btn-primary' : 'bg-slate-900 text-white hover:bg-black') : (isDark ? 'theme-muted theme-text-muted' : 'bg-slate-200 text-slate-500')}`}
                  >
                    Create analysis
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={cancelAnalysis}
                    disabled={isCancelling || isAborted}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      isCancelling || isAborted 
                        ? (isDark ? 'theme-muted theme-text-muted border-slate-600' : 'bg-slate-200 text-slate-400 border-slate-300')
                        : (isDark ? 'border-red-500 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-600 hover:bg-red-50')
                    }`}
                  >
                    {isCancelling ? "Cancelling..." : isAborted ? "Cancelled" : "Cancel Analysis"}
                  </button>
                  {isCompleted ? (
                    <button 
                      onClick={() => {
                        console.log(`[AddSourcesModal] User clicked Access Report for jobId: ${jobId}`);
                        if (jobId) {
                          onComplete(jobId, companyAlias);
                        }
                      }}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                        isDark 
                          ? 'border-green-500 text-green-400 hover:bg-green-900/20' 
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      Access Report
                    </button>
                  ) : (
                    <div className={`flex items-center gap-2 px-4 py-2 text-sm ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                      <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-slate-600 border-t-[color:var(--accent)]' : 'border-slate-300 border-t-slate-600'}`}></div>
                      Processing...
                    </div>
                  )}
                </>
              )}
            </div>
          </form>

          {/* Right: Logs */}
          <div className={`border-t ${isDark ? 'theme-border' : 'border-slate-200'} md:border-l md:border-t-0 h-full`}>
            <div className="px-6 py-6 h-full flex flex-col min-h-0">
              {jobId && (
                <div className="mb-2 flex items-center justify-end">
                  <span className={`rounded-full ${isDark ? 'theme-muted theme-text-muted' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-[10px]`}>{jobId.slice(0, 8)}</span>
                </div>
              )}
              <div 
                ref={logRef} 
                className={`flex-1 min-h-0 overflow-y-auto rounded-lg ${isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-900 ring-1 ring-slate-700'} p-4 text-xs font-mono leading-relaxed`}
              >
                {logs.length === 0 ? (
                  <p className="text-slate-500">Logs will appear here…</p>
                ) : (
                  logs.map((l, i) => {
                    // Determine log type and color
                    let logColor = 'text-slate-300'; // default
                    let prefix = '';
                    
                    if (l.toLowerCase().includes('error') || l.toLowerCase().includes('failed')) {
                      logColor = 'text-red-400';
                      prefix = '❌ ';
                    } else if (l.toLowerCase().includes('warning')) {
                      logColor = 'text-amber-400';
                      prefix = '⚠️  ';
                    } else if (l.toLowerCase().includes('success') || l.toLowerCase().includes('completed') || l.toLowerCase().includes('ready') || l.toLowerCase().includes('saved')) {
                      logColor = 'text-green-400';
                      prefix = '✓ ';
                    } else if (l.toLowerCase().includes('initializing') || l.toLowerCase().includes('triggering') || l.toLowerCase().includes('processing')) {
                      logColor = 'text-blue-400';
                      prefix = '▶ ';
                    } else if (l.toLowerCase().includes('status:') || l.toLowerCase().includes('waiting')) {
                      logColor = 'text-cyan-400';
                      prefix = '⋯ ';
                    } else if (l.toLowerCase().includes('cancel')) {
                      logColor = 'text-orange-400';
                      prefix = '⊗ ';
                    }
                    
                    return (
                      <p key={i} className={`mb-1.5 ${logColor}`}>
                        <span className="opacity-60">[{new Date().toLocaleTimeString()}]</span> {prefix}{l}
                      </p>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}