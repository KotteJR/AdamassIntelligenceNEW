"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../../lib/supabaseClient";
import { UploadCloud, X, FileText } from "lucide-react";
import { useTheme } from "./ThemeToggle";

export interface SourceFormValues {
  companyAlias: string;
  legalAlias: string;
  websiteUrl: string;
  countryOfIncorporation: string;
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
  const [countryOfIncorporation, setCountryOfIncorporation] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [isAborted, setIsAborted] = useState(false);
  const abortedRef = useRef(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (!open) {
      setCompanyAlias("");
      setLegalAlias("");
      setWebsiteUrl("");
      setCountryOfIncorporation("");
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

  if (!open) return null;

  const addLog = (s: string) => setLogs((prev) => [...prev, s]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
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
    const newJob = uuidv4();
    setJobId(newJob);
    setIsProcessing(true);
    setIsAborted(false);
    abortedRef.current = false;
    setLogs([`Initializing analysis for ${companyAlias} (Job ID: ${newJob})`]);

    try {
      addLog("Triggering workflow...");
      const initResponse = await fetch("/api/initiate-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyAlias,
          legalAlias,
          websiteUrl,
          countryOfIncorporation,
          jobId: newJob,
        }),
      });
      const initJson = await initResponse.json();
      if (!initResponse.ok) {
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
        if (!isComplete && completed === total && total === 6) {
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

      // Save to both local Storage (for backward compatibility) and Supabase
      try {
        const saveRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalReportToSave),
        });
        if (!saveRes.ok) {
          const saveError = await saveRes.json();
          console.warn('[AddSourcesModal] Warning: Failed to save to /api/reports:', saveError);
          addLog("Warning: Local storage save failed, continuing...");
        } else {
          console.log('[AddSourcesModal] Successfully saved to /api/reports');
        }
      } catch (saveError) {
        console.warn('[AddSourcesModal] Error saving to /api/reports:', saveError);
        addLog("Warning: Local storage save failed, continuing...");
        // Don't throw, continue with Supabase save
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
      <div className={`w-[1100px] max-w-[98vw] overflow-hidden rounded-2xl ${isDark ? 'theme-card' : 'bg-white'} ${isDark ? 'theme-border border' : 'ring-1 ring-slate-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${isDark ? 'theme-border' : 'border-slate-200'} px-6 py-4`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>New analysis</p>
            <h2 className={`text-xl font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>Create new</h2>
          </div>
          <button onClick={onClose} className={`rounded-full p-2 ${isDark ? 'theme-text-muted hover:theme-muted' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: form */}
          <form className="space-y-5 px-6 py-6">
            <div>
              <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Company alias</label>
              <input
                value={companyAlias}
                onChange={(e) => setCompanyAlias(e.target.value)}
                placeholder="e.g. Innovatech"
                className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                required
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Legal alias</label>
              <input
                value={legalAlias}
                onChange={(e) => setLegalAlias(e.target.value)}
                placeholder="e.g. Innovatech Solutions Ltd."
                className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
                required
              />
            </div>
            <div>
              <label className={`mb-1 block text-xs font-medium uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Country of incorporation</label>
              <input
                value={countryOfIncorporation}
                onChange={(e) => setCountryOfIncorporation(e.target.value)}
                placeholder="e.g. Germany, USA"
                className={`w-full rounded-lg border ${isDark ? 'theme-border bg-transparent theme-text placeholder:theme-text-muted focus:ring-[color:var(--accent)]' : 'border-slate-300 bg-white placeholder-slate-400 focus:border-slate-400 focus:ring-slate-200'} px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2`}
              />
            </div>

            {/* Dropzone-style uploader */}
            <div className={`rounded-xl border border-dashed ${isDark ? 'theme-border theme-muted' : 'border-slate-300 bg-slate-50'} p-5`}>
              <p className={`mb-2 text-sm font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>Upload sources (optional)</p>
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
                      className={`rounded border-2 px-4 py-2 text-sm font-medium transition-colors ${
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
          <div className={`border-t ${isDark ? 'theme-border' : 'border-slate-200'} md:border-l md:border-t-0`}>
            <div className="px-6 py-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-800'}`}>Process Log</h3>
                {jobId && <span className={`rounded-full ${isDark ? 'theme-muted theme-text-muted' : 'bg-slate-100 text-slate-600'} px-2 py-1 text-[10px]`}>{jobId.slice(0, 8)}</span>}
              </div>
              <div ref={logRef} className={`h-[380px] overflow-y-auto rounded-lg ${isDark ? 'theme-muted theme-border border' : 'bg-slate-50 ring-1 ring-slate-200'} p-3 text-xs ${isDark ? 'theme-text' : 'text-slate-800'}`}>
                {logs.length === 0 ? (
                  <p className={`${isDark ? 'theme-text-muted' : 'text-slate-400'}`}>Logs will appear here…</p>
                ) : (
                  logs.map((l, i) => <p key={i} className="mb-1 font-mono">{l}</p>)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}