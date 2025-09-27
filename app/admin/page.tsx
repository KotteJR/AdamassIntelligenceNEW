"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../../lib/supabaseClient';
import ThemeToggle, { useTheme } from '../components/ThemeToggle';
import AuthModal from '../components/AuthModal';

interface Analysis {
  id: string;
  job_id: string;
  company_alias: string;
  legal_alias: string;
  website_url: string;
  country_of_incorporation: string;
  created_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

interface IntelResult {
  id: string;
  job_id: string;
  source: string;
  status: string;
  created_at: string;
}

interface Artifact {
  id: string;
  job_id: string;
  kind: string;
  created_at: string;
  user_id: string;
}

interface AdminStats {
  totals: {
    analyses: number;
    users: number;
    intelResults: number;
    artifacts: number;
  };
  recent: {
    analyses: number;
    artifacts: number;
  };
  topCompanies: Array<{ company: string; count: number }>;
  artifactTypes: Record<string, number>;
}

export default function AdminDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const { isDark } = useTheme();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [intelResults, setIntelResults] = useState<IntelResult[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'analyses' | 'intel' | 'artifacts'>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Check if user is admin
  // Admin access is controlled by database flags and server-side environment variables
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load user profile and check admin status
  useEffect(() => {
    // Open auth modal automatically when not signed in
    if (!user && !userLoading) {
      setAuthOpen(true);
    } else if (user) {
      setAuthOpen(false);
    }

    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Get session token for API calls
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.warn('No session token available');
          return;
        }

        // Check admin status via API (which uses environment variables)
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          console.warn('User is not admin:', response.status);
        }
      } catch (err) {
        console.warn('Could not check admin status:', err);
        setIsAdmin(false);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && user && isAdmin) {
      loadData();
    } else if (!userLoading && user && !isAdmin) {
      setError('Access denied. Admin privileges required.');
    }
  }, [user, userLoading, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No authentication token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
      
      // Load stats first
      const statsResponse = await fetch('/api/admin/stats', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        const errorData = await statsResponse.json();
        setError(errorData.error || 'Failed to load stats');
        return;
      }
      
      // Load analyses using the admin API endpoint
      const analysesResponse = await fetch('/api/admin/analyses', { headers });
      if (analysesResponse.ok) {
        const analysesData = await analysesResponse.json();
        setAnalyses(analysesData.analyses || []);
      } else {
        const errorData = await analysesResponse.json();
        console.warn('Error loading analyses:', errorData);
        if (errorData.error?.includes('Unauthorized')) {
          setError('Admin access denied. Please check your permissions.');
        } else {
          setError(errorData.error || 'Failed to load analyses');
        }
      }

      // Load intel results and artifacts will be handled by separate API endpoints
      // For now, we'll just set empty arrays to avoid database conflicts
      setIntelResults([]);
      setArtifacts([]);

    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (jobId: string) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No authentication token available');
        return;
      }

      // Use the admin API endpoint for deletion
      const response = await fetch('/api/admin/analyses', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete analysis');
      }

      // Reload data
      await loadData();
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting analysis:', err);
      setError(err.message);
    }
  };

  const createNewAnalysis = async () => {
    // Redirect to main page with auth parameter to open the create modal
    window.location.href = '/?auth=1';
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Dashboard</h1>
          <p className="text-slate-600">Please sign in to access the admin dashboard.</p>
          <div className="mt-6">
            <button
              onClick={() => setAuthOpen(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDark ? 'btn-primary' : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              Sign in
            </button>
          </div>
          {/* Auth Modal */}
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            onAuthSuccess={() => setAuthOpen(false)}
          />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-slate-600">You don't have admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'theme-bg' : 'theme-bg'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-20 border-b ${isDark ? 'theme-border' : 'theme-border'} ${isDark ? 'theme-bg' : 'theme-bg'} backdrop-blur`}>
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <img src="/logo/adamass.svg" alt="Adamass" className={`h-6 ${isDark ? 'brightness-0 invert' : ''}`} />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={createNewAnalysis}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDark 
                  ? 'btn-primary' 
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              + Create Analysis
            </button>
            <ThemeToggle />
            <div className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
              {user.email}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 rounded-lg bg-slate-100 p-1">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'analyses', label: `Analyses (${analyses.length})` },
              { key: 'intel', label: `Intel Results (${intelResults.length})` },
              { key: 'artifacts', label: `Artifacts (${artifacts.length})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {selectedTab === 'overview' && stats && (
              <div className="space-y-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  Dashboard Overview
                </h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                      {stats.totals.analyses}
                    </div>
                    <div className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                      Total Analyses
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                      {stats.recent.analyses} this week
                    </div>
                  </div>
                  
                  <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                      {stats.totals.users}
                    </div>
                    <div className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                      Total Users
                    </div>
                  </div>
                  
                  <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                      {stats.totals.artifacts}
                    </div>
                    <div className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                      Generated Artifacts
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                      {stats.recent.artifacts} this week
                    </div>
                  </div>
                  
                  <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                    <div className={`text-2xl font-bold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                      {stats.totals.intelResults}
                    </div>
                    <div className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                      Intel Results
                    </div>
                  </div>
                </div>

                {/* Top Companies */}
                <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-md font-semibold mb-3 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                    Top Companies by Analysis Count
                  </h3>
                  <div className="space-y-2">
                    {stats.topCompanies.slice(0, 5).map((company, index) => (
                      <div key={company.company} className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'theme-text' : 'text-slate-700'}`}>
                          {index + 1}. {company.company}
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                          {company.count} analyses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Artifact Types */}
                <div className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-md font-semibold mb-3 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                    Artifact Types Generated
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(stats.artifactTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'theme-text' : 'text-slate-700'}`}>
                          {type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analyses Tab */}
            {selectedTab === 'analyses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                    Company Analyses
                  </h2>
                  <button
                    onClick={loadData}
                    className={`text-sm ${isDark ? 'theme-text-secondary hover:accent' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid gap-4">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                              {analysis.company_alias}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isDark ? 'theme-muted theme-text-muted' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {analysis.job_id}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Legal Name:</span>
                              <p className={`${isDark ? 'theme-text' : 'text-slate-900'}`}>{analysis.legal_alias || 'N/A'}</p>
                            </div>
                            <div>
                              <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Website:</span>
                              <p className={`${isDark ? 'theme-text' : 'text-slate-900'}`}>
                                <a href={analysis.website_url} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:text-blue-800">
                                  {analysis.website_url}
                                </a>
                              </p>
                            </div>
                            <div>
                              <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Country:</span>
                              <p className={`${isDark ? 'theme-text' : 'text-slate-900'}`}>{analysis.country_of_incorporation || 'N/A'}</p>
                            </div>
                            <div>
                              <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Created:</span>
                              <p className={`${isDark ? 'theme-text' : 'text-slate-900'}`}>
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <span className={`${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>User:</span>
                            <span className={`ml-1 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                              {analysis.user_name || analysis.user_email || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => window.open(`/report?jobId=${analysis.job_id}`, '_blank')}
                            className={`px-3 py-1 text-sm rounded-md ${
                              isDark 
                                ? 'theme-muted theme-text hover:theme-accent' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(analysis.job_id)}
                            className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intel Results Tab */}
            {selectedTab === 'intel' && (
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  Intel Results (Raw Data)
                </h2>
                
                <div className="grid gap-4">
                  {intelResults.map((result) => (
                    <div
                      key={result.id}
                      className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className={`font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                              {result.source}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            Job ID: {result.job_id}
                          </p>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            Created: {new Date(result.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Artifacts Tab */}
            {selectedTab === 'artifacts' && (
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                  Generated Artifacts
                </h2>
                
                <div className="grid gap-4">
                  {artifacts.map((artifact) => (
                    <div
                      key={artifact.id}
                      className={`rounded-lg border p-4 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <span className={`font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                              {artifact.kind.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            Job ID: {artifact.job_id}
                          </p>
                          <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                            Created: {new Date(artifact.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'theme-card' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'theme-text' : 'text-slate-900'}`}>
              Confirm Deletion
            </h3>
            <p className={`mb-6 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
              Are you sure you want to delete this analysis? This will permanently remove:
            </p>
            <ul className={`mb-6 text-sm space-y-1 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
              <li>• Analysis data and report</li>
              <li>• All intel results</li>
              <li>• All generated artifacts</li>
              <li>• Storage files</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 text-sm rounded-md ${
                  isDark 
                    ? 'theme-muted theme-text hover:theme-accent' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAnalysis(deleteConfirm)}
                className="flex-1 px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
