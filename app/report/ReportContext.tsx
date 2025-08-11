"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface StoredReport {
  jobId: string;
  companyAlias: string;
  dateGenerated: string;
  companyIntelligence: any;
  architecture: any;
  security: any;
  adamassSynthesisReport?: any;
}

interface ReportContextType {
  report: StoredReport | null;
  isLoading: boolean;
  jobId: string | null;
}

const ReportContext = createContext<ReportContextType>({
  report: null,
  isLoading: true,
  jobId: null,
});

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<StoredReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let retrievedJobId: string | null = null;
    if (typeof window !== 'undefined') {
      retrievedJobId = localStorage.getItem('currentJobId');
      setJobId(retrievedJobId);
      if (retrievedJobId) {
        fetch(`/api/reports/${retrievedJobId}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setReport(data))
          .catch(() => setReport(null))
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <ReportContext.Provider value={{ report, isLoading, jobId }}>
      {children}
    </ReportContext.Provider>
  );
}