"use client";

import dynamic from 'next/dynamic';

// Dynamically import ReportClient with SSR turned off
const ReportClient = dynamic(() => import('./ReportClient'), { 
  ssr: false, 
  loading: () => <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4"><p className="text-xl text-gray-700">Loading report...</p></div>
});

export default function ReportLoader() {
  return <ReportClient />;
} 