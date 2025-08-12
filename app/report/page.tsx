"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ChatPanel from "./ChatPanel";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle, { useTheme } from "../components/ThemeToggle";
import { ReportProvider, useReport } from "./ReportContext";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../../lib/supabaseClient";
import MindMapVisualization from "../components/MindMapVisualization";

const ReportClient = dynamic(() => import("./ReportClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center text-slate-700">Loading report...</div>
  ),
});

// Auto-play podcast component
const AutoPlayPodcast: React.FC<{ segments: any[] }> = ({ segments }) => {
  const { isDark } = useTheme();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElements] = useState<HTMLAudioElement[]>([]);

  // Create audio elements for all segments
  React.useEffect(() => {
    segments.forEach((segment, index) => {
      if (segment.audio && !audioElements[index]) {
        const audio = new Audio(`data:audio/mpeg;base64,${segment.audio}`);
        audio.addEventListener('ended', () => {
          // Auto-play next segment
          if (index < segments.length - 1) {
            setCurrentSegment(index + 1);
            setTimeout(() => {
              const nextAudio = audioElements[index + 1];
              if (nextAudio) {
                nextAudio.play();
              }
            }, 500); // Small delay between segments
          } else {
            setIsPlaying(false); // End of podcast
          }
        });
        audioElements[index] = audio;
      }
    });
    return () => {
      // Cleanup
      audioElements.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, [segments, audioElements]);

  const playFromSegment = (segmentIndex: number) => {
    // Stop current audio
    audioElements.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    setCurrentSegment(segmentIndex);
    setIsPlaying(true);
    
    const audio = audioElements[segmentIndex];
    if (audio) {
      audio.play();
    }
  };

  const togglePlayPause = () => {
    const audio = audioElements[currentSegment];
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    }
  };

  const validSegments = segments.filter(s => s.audio);

  return (
    <div className="space-y-6">
      {/* Player Controls */}
      <div className={`rounded-xl p-6 ${isDark ? 'theme-card' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[color:var(--accent)] to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.786L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.786a1 1 0 011.617.786zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.829 1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h3 className={`font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>Business Analysis Podcast</h3>
              <p className={`text-sm ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                Segment {currentSegment + 1} of {validSegments.length} • Auto-play enabled
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlayPause}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'btn-primary' : 'bg-slate-900 hover:bg-black text-white'}`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex space-x-1 mb-4">
          {validSegments.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentSegment ? 'bg-[color:var(--accent)]' : `${isDark ? 'theme-muted' : 'bg-slate-200'}`
              }`}
            />
          ))}
        </div>
      </div>

      {/* Segment List */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 transition-all ${
              index === currentSegment && isPlaying
                ? `${isDark ? 'border-[color:var(--accent)] theme-muted' : 'border-blue-300 bg-blue-50'}`
                : `${isDark ? 'theme-border hover:border-[color:var(--border-secondary)]' : 'border-slate-200 hover:border-slate-300'}`
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                  segment.speaker === 'HOST' ? 'bg-[color:var(--accent)]' : 'bg-green-500'
                }`}>
                  {segment.speaker === 'HOST' ? 'H' : 'G'}
                </div>
                <div>
                  <div className={`font-medium ${isDark ? 'theme-text' : 'text-slate-900'}`}>
                    {segment.speaker === 'HOST' ? 'Host' : 'Guest Expert'}
                  </div>
                  <div className={`text-xs ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>
                    {segment.speaker === 'HOST' ? 'Business Journalist' : 'Strategic Analyst'}
                  </div>
                </div>
              </div>
              {segment.audio && (
                <button
                  onClick={() => playFromSegment(index)}
                  className={`text-sm font-medium ${isDark ? 'accent hover:opacity-80' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  Play from here
                </button>
              )}
            </div>
            
            <div className="mb-3">
              <p className={`leading-relaxed ${isDark ? 'theme-text-secondary' : 'text-slate-700'}`}>{segment.text}</p>
            </div>
            
            {!segment.audio && segment.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-red-600 text-sm">⚠️ {segment.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

type StudioCardProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  onClick?: () => void;
  disabled?: boolean;
  isGenerated?: boolean;
  buttonText?: string;
  isLoading?: boolean;
};

function StudioCard({ title, subtitle, imageSrc, onClick, disabled, isGenerated = false, buttonText = "Generate", isLoading = false }: StudioCardProps) {
  const { isDark } = useTheme();
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group relative h-56 w-full overflow-hidden rounded-2xl border ${isDark ? 'theme-card theme-border hover:border-[color:var(--border-secondary)]' : 'border-slate-200 bg-white'} text-left shadow-sm transition focus:outline-none ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
      }`}
    >
      <div className="relative h-28 w-full">
        <Image src={imageSrc} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>
      <div className="flex h-[calc(100%-7rem)] flex-col justify-between px-3 pb-3 pt-2">
        <div>
          <div className={`text-sm font-semibold leading-tight ${isDark ? 'theme-text' : 'text-slate-800'}`}>{title}</div>
          <div className={`mt-1 text-xs leading-tight ${isDark ? 'theme-text-muted' : 'text-slate-500'}`}>{subtitle}</div>
        </div>
      </div>
      <div className={`pointer-events-none absolute right-3 top-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium shadow-sm ring-1 backdrop-blur ${
        isGenerated 
          ? 'bg-green-100 text-green-700 ring-green-200' 
          : isDark 
            ? 'theme-muted theme-text ring-[color:var(--border-primary)] group-hover:theme-card' 
            : 'bg-white/80 text-slate-700 ring-slate-200 group-hover:bg-white'
      }`}>
        {isGenerated ? 'View' : buttonText}
      </div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'}`}>
          <div className="flex flex-col items-center space-y-2">
            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-slate-600 border-t-[color:var(--accent)]' : 'border-slate-300 border-t-slate-600'}`}></div>
            <div className={`text-xs font-medium ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Generating...</div>
          </div>
        </div>
      )}
    </button>
  );
}

function ReportConsoleContent() {
  const { report } = useReport();
  const { isDark } = useTheme();
  
  // Collapsible sidebars state (desktop)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  // Mobile: which pane is visible
  const [mobileView, setMobileView] = useState<'report' | 'chat' | 'studio'>('report');
  // Optional: restore persisted state
  useEffect(() => {
    try {
      const left = typeof window !== 'undefined' ? localStorage.getItem('console_left_collapsed') : null;
      const right = typeof window !== 'undefined' ? localStorage.getItem('console_right_collapsed') : null;
      if (left != null) setIsLeftCollapsed(left === '1');
      if (right != null) setIsRightCollapsed(right === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('console_left_collapsed', isLeftCollapsed ? '1' : '0');
        localStorage.setItem('console_right_collapsed', isRightCollapsed ? '1' : '0');
      }
    } catch {}
  }, [isLeftCollapsed, isRightCollapsed]);

  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const startProcessing = (action: string) => setProcessingActions(prev => {
    const next = new Set(prev); next.add(action); return next;
  });
  const stopProcessing = (action: string) => setProcessingActions(prev => {
    const next = new Set(prev); next.delete(action); return next;
  });
  const isProcessing = (action: string) => processingActions.has(action);
  const [generatedContent, setGeneratedContent] = useState<{
    audioOverview?: { url: string; script: string };
    audioReport?: { url?: string; script?: string; segments?: { title: string; text: string; url: string }[] };
    podcast?: { 
      url?: string; 
      script: string; 
      type: 'continuous' | 'segments' | 'segments_autoplay';
      projectId?: string;
      segments?: any[];
      totalSegments?: number;
      successfulSegments?: number;
    };
    mindmap?: any;
  }>({});
  const [activeTab, setActiveTab] = useState<'report' | 'audioReport' | 'podcast' | 'mindmap'>('report');
  const { user } = useUser();

  const getCurrentJobId = () => (report as any)?.jobId || (typeof window !== 'undefined' ? localStorage.getItem('currentJobId') : null);

  const persistArtifact = async (
    kind: 'audio_overview' | 'audio_report' | 'podcast' | 'mindmap',
    options: { content?: any; meta?: any; audioBase64?: string }
  ) => {
    try {
      if (!user || !report) return;
      const currentJobId = getCurrentJobId();
      if (!currentJobId) return;
      const { error } = await supabase.from('user_artifacts').insert([
        {
          user_id: user.id,
          job_id: currentJobId,
          kind,
          content: options.content ?? null,
          meta: options.meta ?? null,
          audio_base64: options.audioBase64 ?? null,
        },
      ]);
      if (error) console.warn('Persist artifact warning:', error.message);
    } catch (e) {
      console.warn('Persist artifact error:', e);
    }
  };

  // Load saved artifacts efficiently per kind (min columns, latest only)
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        if (!user || !report) return;
        const currentJobId = getCurrentJobId();
        if (!currentJobId) return;

        const selectColumns = 'kind, meta, content, audio_base64';

        const queries = [
          supabase.from('user_artifacts').select(selectColumns).eq('user_id', user.id).eq('job_id', currentJobId).eq('kind', 'audio_overview').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('user_artifacts').select(selectColumns).eq('user_id', user.id).eq('job_id', currentJobId).eq('kind', 'audio_report').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('user_artifacts').select(selectColumns).eq('user_id', user.id).eq('job_id', currentJobId).eq('kind', 'podcast').order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('user_artifacts').select(selectColumns).eq('user_id', user.id).eq('job_id', currentJobId).eq('kind', 'mindmap').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ];

        const [overviewRes, reportRes, podcastRes, mindmapRes] = await Promise.all(queries);

        const toObjectUrl = (base64: string, mime = 'audio/mpeg') => {
          const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: mime });
          return URL.createObjectURL(blob);
        };

        setGeneratedContent(prev => ({
          ...prev,
          ...(overviewRes.data ? { audioOverview: { url: overviewRes.data.audio_base64 ? toObjectUrl(overviewRes.data.audio_base64) : '', script: overviewRes.data.meta?.script || '' } } : {}),
          ...(reportRes.data ? {
            audioReport: reportRes.data.content?.sections ? {
              segments: reportRes.data.content.sections.map((s: any) => ({ title: s.title, text: s.text, url: s.audio ? toObjectUrl(s.audio) : '' }))
            } : { url: reportRes.data.audio_base64 ? toObjectUrl(reportRes.data.audio_base64) : '', script: reportRes.data.meta?.script || '' }
          } : {}),
          ...(podcastRes.data ? { podcast: { type: 'segments_autoplay', script: 'Saved podcast', segments: podcastRes.data.content?.segments || [] } as any } : {}),
          ...(mindmapRes.data ? { mindmap: mindmapRes.data.content } : {}),
        }));
      } catch (e) {
        console.error('Error loading artifacts:', e);
      }
    };
    loadArtifacts();
  }, [user, report]);

  // Modern sectioned audio player
  const AudioReportPlayer: React.FC<{ segments: { title: string; text: string; url: string }[] }> = ({ segments }) => {
    const { isDark } = useTheme();
    const [currentIdx, setCurrentIdx] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const playIndex = async (idx: number) => {
      if (!segments[idx]) return;
      const audio = audioRef.current || new Audio();
      audioRef.current = audio;
      setCurrentIdx(idx);
      setIsPlaying(true);
      audio.src = segments[idx].url;
      audio.onended = () => setIsPlaying(false);
      try { await audio.play(); } catch { setIsPlaying(false); }
    };

    const stop = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    };

    const playAll = async () => {
      stop();
      for (let i = 0; i < segments.length; i++) {
        await new Promise<void>((resolve) => {
          const audio = audioRef.current || new Audio();
          audioRef.current = audio;
          setCurrentIdx(i);
          setIsPlaying(true);
          audio.src = segments[i].url;
          audio.onended = () => resolve();
          audio.play().catch(() => resolve());
        });
      }
      setIsPlaying(false);
      setCurrentIdx(null);
    };

    return (
      <div className="space-y-5">
        <button
          onClick={playAll}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'btn-primary' : 'bg-slate-900 text-white hover:bg-black'}`}
        >
          Play All
        </button>

        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <div key={idx} className={`rounded-xl border p-4 transition ${currentIdx===idx && isPlaying ? `${isDark ? 'border-[color:var(--accent)] theme-muted' : 'border-slate-900 bg-slate-50'}` : `${isDark ? 'theme-border hover:border-[color:var(--border-secondary)]' : 'border-slate-200 hover:border-slate-300'}`}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-semibold ${currentIdx===idx && isPlaying ? `${isDark ? 'bg-[color:var(--accent)] text-[#0b0b0b]' : 'bg-slate-900 text-white'}` : `${isDark ? 'theme-muted theme-text-secondary' : 'bg-slate-200 text-slate-700'}`}`}>{idx+1}</div>
                  <div className={`text-sm font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>{seg.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  {currentIdx===idx && isPlaying ? (
                    <button onClick={stop} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${isDark ? 'theme-border theme-text-secondary hover:theme-muted' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Stop</button>
                  ) : (
                    <button onClick={() => playIndex(idx)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isDark ? 'btn-primary' : 'bg-slate-900 text-white hover:bg-black'}`}>Play</button>
                  )}
                </div>
              </div>
              {seg.text && (
                <p className={`mt-2 text-xs line-clamp-2 ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>{seg.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleStudioAction = async (action: string) => {
    if (!user) {
      alert('Please sign in to use Studio features');
      if (typeof window !== 'undefined') window.location.href = '/?auth=1';
      return;
    }
    if (!report) {
      alert('No report data available');
      return;
    }

    // Check if content already exists and switch to view mode
    switch (action) {
      case 'Mind Map':
        if (generatedContent.mindmap) {
          setActiveTab('mindmap');
          return;
        }
        break;
      case 'Generate Podcast':
        if (generatedContent.podcast) {
          setActiveTab('podcast');
          return;
        }
        break;
      case 'Audio Report':
        if (generatedContent.audioReport) {
          setActiveTab('audioReport');
          return;
        }
        break;
      case 'Audio Overview':
        if (generatedContent.audioOverview) {
          setActiveTab('audioReport');
          return;
        }
        break;
    }

    startProcessing(action);

    try {
      let endpoint = '';
      switch (action) {
        case 'Audio Overview':
          endpoint = '/api/studio/audio-overview';
          break;
        case 'Audio Report':
          endpoint = '/api/studio/audio-report';
          break;
        case 'Generate Podcast':
          endpoint = '/api/studio/podcast-segments';
          break;
        case 'Mind Map':
          endpoint = '/api/studio/mindmap';
          break;
        case 'Export PDF':
          alert('PDF export coming soon');
          stopProcessing(action);
          return;
        default:
          alert(`${action} not yet implemented`);
          stopProcessing(action);
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reportData: { 
            ...report, 
            jobId: (report as any).jobId || (typeof window !== 'undefined' ? localStorage.getItem('currentJobId') : null) 
          }, 
          userId: user?.id || undefined, 
          jobId: (report as any).jobId || (typeof window !== 'undefined' ? localStorage.getItem('currentJobId') : null) 
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.audio) {
          // Handle audio - preview only (no auto download)
          const audioBlob = new Blob([
            Uint8Array.from(atob(data.audio.data), c => c.charCodeAt(0))
          ], { type: data.audio.mimeType });
          
          const url = URL.createObjectURL(audioBlob);
          
          // Store for preview and switch tab
          if (action === 'Audio Report') {
            setGeneratedContent(prev => ({
              ...prev,
              audioReport: { url, script: data.script }
            }));
            persistArtifact('audio_report', { meta: { script: data.script }, audioBase64: data.audio.data });
            setActiveTab('audioReport');
          }
          
          // Optional manual download message removed; users can download from player menu if desired
        } else if (data.type === 'audio_report_segments' && data.segments) {
          // Build object URLs for each segment
          const segments = (data.segments as any[]).map((s: any) => {
            const blob = new Blob([
              Uint8Array.from(atob(s.audio), (c) => c.charCodeAt(0))
            ], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            return { title: s.title, text: s.text, url };
          });
          setGeneratedContent(prev => ({
            ...prev,
            audioReport: { segments }
          }));
          // Persist segmented audio report so it's available on reload
          await persistArtifact('audio_report', { content: { sections: data.segments } });
          setActiveTab('audioReport');
        } else if (data.type === 'continuous_podcast' && data.audio) {
          // Handle continuous podcast audio
          const audioBlob = new Blob([
            Uint8Array.from(atob(data.audio.data), c => c.charCodeAt(0))
          ], { type: data.audio.mimeType });
          
          const url = URL.createObjectURL(audioBlob);
          
          
          // Store for preview
          setGeneratedContent(prev => ({
            ...prev,
            podcast: { 
              url, 
              script: data.script, 
              type: 'continuous',
              projectId: data.projectId 
            }
          }));
          setActiveTab('podcast');
          // No auto download; preview available in the middle column
        } else if (data.segments && data.type === 'segmented_podcast') {
          // Handle new segmented podcast with auto-play
          setGeneratedContent(prev => ({
            ...prev,
            podcast: { 
              segments: data.segments, 
              script: data.script, 
              type: 'segments_autoplay',
              totalSegments: data.totalSegments,
              successfulSegments: data.successfulSegments
            }
          }));
          // Persist segmented podcast
          persistArtifact('podcast', { content: { segments: data.segments }, meta: { script: data.script } });
          setActiveTab('podcast');
          
        } else if (data.audioSegments) {
          // Handle legacy segmented podcast (fallback)
          setGeneratedContent(prev => ({
            ...prev,
            podcast: { segments: data.audioSegments, script: data.script, type: 'segments' }
          }));
          setActiveTab('podcast');
          
        } else if (data.mindmap) {
          // Mindmap: preview only (no auto download)
          const mindmapBlob = new Blob([JSON.stringify(data.mindmap, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(mindmapBlob);
          // Store for preview
          setGeneratedContent(prev => ({
            ...prev,
            mindmap: data.mindmap
          }));
          persistArtifact('mindmap', { content: data.mindmap });
          setActiveTab('mindmap');
          // Keep object URL only for preview context; no auto download
        }
      } else {
        throw new Error(data.error || 'Generation failed');
      }

    } catch (error) {
      console.error(`${action} error:`, error);
      
      // More helpful error messages
      let errorMessage = `Failed to generate ${action}.`;
      
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('high traffic')) {
          errorMessage = `${action} failed: ElevenLabs is experiencing high traffic. Please wait a moment and try again.`;
        } else if (error.message.includes('Invalid') && error.message.includes('API key')) {
          errorMessage = `${action} failed: Invalid ElevenLabs API key. Please check configuration.`;
        } else if (error.message.includes('Network error')) {
          errorMessage = `${action} failed: Network connectivity issue. Please check your connection and try again.`;
        } else if (error.message.includes('OpenAI')) {
          errorMessage = `${action} failed: Script generation error. Please try again.`;
        } else {
          errorMessage = `${action} failed: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      stopProcessing(action);
    }
  };

  // Tab content component
  const TabContent = () => {
        const availableTabs = [
          { id: 'report', label: 'Report', available: true },
          { id: 'audioReport', label: 'Audio Report', available: !!generatedContent.audioReport },
          { id: 'podcast', label: 'Podcast', available: !!generatedContent.podcast },
          { id: 'mindmap', label: 'Mind Map', available: !!generatedContent.mindmap }
        ].filter(tab => tab.available);

    return (
      <div className="h-full flex flex-col">
        {/* Modern Tab Navigation */}
        <div className={`border-b ${isDark ? 'theme-border' : 'border-slate-200'} ${isDark ? 'theme-card' : 'bg-white'}`}>
          <div className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? `${isDark ? 'border-[color:var(--accent)] accent' : 'border-slate-900 text-slate-900'}`
                    : `border-transparent ${isDark ? 'theme-text-muted hover:border-[color:var(--border-secondary)] hover:theme-text-secondary' : 'text-slate-500 hover:border-slate-300 hover:text-slate-700'}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`flex-1 overflow-y-auto ${isDark ? 'theme-card' : ''}`}>
          {activeTab === 'report' && <ReportClient />}
          
          

          {activeTab === 'audioReport' && generatedContent.audioReport && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className={`border rounded-xl p-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                  <div className="mb-6">
                    <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Audio Report</h2>
                    <p className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>Consultant-style segments you can play individually or continuously.</p>
                  </div>
                  {generatedContent.audioReport.segments ? (
                    <AudioReportPlayer segments={generatedContent.audioReport.segments} />
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'podcast' && generatedContent.podcast && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className={`border rounded-xl p-6 ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                  <div className="mb-6">
                    <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Business Analysis Podcast</h2>
                    <p className={`text-sm ${isDark ? 'theme-text-muted' : 'text-slate-600'}`}>
                      {generatedContent.podcast.type === 'continuous' 
                        ? 'Professional podcast discussion with continuous conversation flow'
                        : 'AI-generated conversational analysis with multiple speakers'
                      }
                    </p>
                  </div>
                  
                  {generatedContent.podcast.type === 'continuous' && generatedContent.podcast.url && (
                    <div className="space-y-6">
                      {/* Continuous Podcast Player */}
                      <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.786L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.786a1 1 0 011.617.786zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.414A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.829 1 1 0 010-1.414z" clipRule="evenodd"></path>
                              </svg>
                            </div>
                            <div>
                              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Business Analysis Deep Dive</h3>
                              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Strategic discussion & insights</p>
                            </div>
                          </div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            ElevenLabs Studio Generated
                          </div>
                        </div>
                        
                        <audio controls className="w-full">
                          <source src={generatedContent.podcast.url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        
                        {generatedContent.podcast.projectId && (
                          <div className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Project ID: {generatedContent.podcast.projectId}
                          </div>
                        )}
                      </div>
                      
                      {/* Script Section */}
                      <div>
                        <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Podcast Script</h3>
                        <div className={`rounded-lg p-4 text-sm whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                          {generatedContent.podcast.script}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {generatedContent.podcast.type === 'segments_autoplay' && generatedContent.podcast.segments && (
                    <AutoPlayPodcast segments={generatedContent.podcast.segments} />
                  )}
                  
                  {generatedContent.podcast.type === 'segments' && generatedContent.podcast.segments && (
                    <div className="space-y-4">
                      {generatedContent.podcast.segments.map((segment, index) => (
                        <div key={index} className={`border rounded-lg p-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                                segment.speaker === 'Sarah' ? 'bg-blue-500' : 'bg-green-500'
                              }`}>
                                {segment.speaker === 'Sarah' ? 'S' : 'M'}
                              </div>
                              <div>
                                <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{segment.speaker}</div>
                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {segment.speaker === 'Sarah' ? 'Senior Analyst' : 'Strategic Advisor'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{segment.text}</p>
                          </div>
                          
                          {segment.audio && (
                            <div className={`rounded p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                              <audio controls className="w-full">
                                <source src={`data:audio/mpeg;base64,${segment.audio}`} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mindmap' && generatedContent.mindmap && (
            <div className="h-full flex flex-col">
              {/* Header with controls */}
              <div className={`flex-shrink-0 border-b px-6 py-4 ${isDark ? 'theme-border theme-card' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'theme-text' : 'text-slate-900'}`}>Interactive Mind Map</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>
                      Explore the visual relationship structure with {generatedContent.mindmap.nodes?.length || 0} nodes
                    </p>
                  </div>
                              <button
                                onClick={() => {
                                  const mindmapBlob = new Blob([JSON.stringify(generatedContent.mindmap, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(mindmapBlob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${report?.companyAlias || 'company'}_mindmap.json`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                    className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'theme-border theme-text-secondary theme-muted hover:theme-card focus:ring-[color:var(--accent)]' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-indigo-500'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON
                  </button>
                </div>
              </div>
              
              {/* Interactive Mind Map */}
              <div className="flex-1 min-h-0">
                <MindMapVisualization data={generatedContent.mindmap} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className={`flex h-screen flex-col overflow-hidden ${isDark ? 'theme-bg' : 'theme-bg'}`}>
      {/* Console-only header (match landing) */}
      <div className={`z-30 border-b ${isDark ? 'theme-border theme-bg' : 'border-slate-200 bg-white/70'} backdrop-blur`}>
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img src="/logo/adamass.svg" alt="Adamass" className={`h-6 ${isDark ? 'brightness-0 invert' : ''}`} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                isDark 
                  ? 'btn-primary' 
                  : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile & Desktop Layout */}
      <div className="grow overflow-hidden">
        {/* Mobile: Tabbed layout with full-screen panes */}
        <div className="flex h-full flex-col gap-3 p-3 lg:hidden">
          {/* Mobile top tabs */}
          <div className={`rounded-xl border ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
            <div className="p-2">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'chat', label: 'Chat' },
                  { id: 'report', label: 'Report' },
                  { id: 'studio', label: 'Studio' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setMobileView(t.id)}
                    className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                      mobileView === t.id
                        ? (isDark ? 'theme-muted' : 'bg-slate-100 text-slate-900')
                        : (isDark ? 'theme-card theme-text-muted hover:theme-muted' : 'bg-white text-slate-600 hover:bg-slate-50')
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pane content */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileView === 'chat' && (
              <div className={`h-full rounded-2xl border ${isDark ? 'theme-card theme-border' : 'bg-slate-50 border-slate-200'}`}>
                <div className="h-full">
                  <ChatPanel showHeader reportData={report} />
                </div>
              </div>
            )}

            {mobileView === 'report' && (
              <div className={`h-full rounded-2xl border ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
                <TabContent />
              </div>
            )}

            {mobileView === 'studio' && (
              <div className={`h-full rounded-2xl border p-3 ${isDark ? 'theme-card theme-border' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <StudioCard
                    title="Mind Map"
                    subtitle="Visual relationships"
                    imageSrc="/features/mindmap.png"
                    onClick={() => handleStudioAction('Mind Map')}
                    disabled={isProcessing('Mind Map')}
                    isGenerated={!!generatedContent.mindmap}
                    buttonText="Generate"
                    isLoading={isProcessing('Mind Map')}
                  />
                  <StudioCard
                    title="Podcast"
                    subtitle="AI discussion"
                    imageSrc="/features/podcast.png"
                    onClick={() => handleStudioAction('Generate Podcast')}
                    disabled={isProcessing('Generate Podcast')}
                    isGenerated={!!generatedContent.podcast}
                    buttonText="Generate"
                    isLoading={isProcessing('Generate Podcast')}
                  />
                  <StudioCard
                    title="Audio Report"
                    subtitle="Full narration"
                    imageSrc="/features/audioreport.png"
                    onClick={() => handleStudioAction('Audio Report')}
                    disabled={isProcessing('Audio Report')}
                    isGenerated={!!generatedContent.audioReport}
                    buttonText="Generate"
                    isLoading={isProcessing('Audio Report')}
                  />
                  <StudioCard
                    title="Export PDF"
                    subtitle="Download report"
                    imageSrc="/features/pdf.svg"
                    onClick={() => handleStudioAction('Export PDF')}
                    disabled={true}
                    isGenerated={false}
                    buttonText="Coming Soon"
                    isLoading={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Grid layout with collapsible sidebars */}
        <div
          className="hidden h-full grid gap-4 overflow-hidden px-4 py-4 lg:grid"
          style={{
            gridTemplateColumns: `${isLeftCollapsed ? '44px' : '380px'} minmax(0,1fr) ${isRightCollapsed ? '44px' : '380px'}`,
            transition: 'grid-template-columns 300ms ease',
          }}
        >
          {/* Desktop Left: Chat */}
          <aside className={`relative h-[calc(100vh-56px-32px)] overflow-hidden rounded-2xl border ${
            isDark
              ? `theme-border ${isLeftCollapsed ? 'theme-card hover:theme-muted' : 'theme-card'}`
              : (isLeftCollapsed ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-50 border-slate-200')
          }`}>
            {!isLeftCollapsed ? (
              <div className="h-full flex flex-col p-2 transition-all duration-300">
                <div className="px-2 pb-2 pt-1 flex items-center justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Chat</h3>
                  <button
                    aria-label="Collapse chat"
                    onClick={() => setIsLeftCollapsed(true)}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors ${
                      isDark
                        ? 'theme-text-muted hover:theme-muted hover:ring-1 hover:ring-[color:var(--border-primary)]'
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <svg className={"w-4 h-4"} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="h-[calc(100%-44px)] overflow-hidden">
                  <ChatPanel reportData={report} />
                </div>
              </div>
            ) : (
              <button
                aria-label="Open Chat"
                onClick={() => setIsLeftCollapsed(false)}
                className={`h-full w-full flex items-center justify-center transition-colors bg-transparent`}
                title="Open Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${isDark ? 'theme-text' : 'text-slate-700'}`}>
                  <path d="M4 4h16a2 2 0 012 2v8a2 2 0 01-2 2H10l-4 3v-3H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  <circle cx="9" cy="10" r="1.25" />
                  <circle cx="13" cy="10" r="1.25" />
                  <circle cx="17" cy="10" r="1.25" />
                </svg>
              </button>
            )}
          </aside>

          {/* Desktop Middle: Tabbed Content */}
          <section className={`h-[calc(100vh-56px-32px)] overflow-hidden rounded-2xl border ${isDark ? 'theme-card theme-border' : 'bg-white border-slate-200'}`}>
            <TabContent />
          </section>

          {/* Desktop Right: Studio Actions */}
          <aside className={`relative h-[calc(100vh-56px-32px)] overflow-hidden rounded-2xl border ${
            isDark
              ? `theme-border ${isRightCollapsed ? 'theme-card hover:theme-muted' : 'theme-card'}`
              : (isRightCollapsed ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-50 border-slate-200')
          }`}>
            {!isRightCollapsed ? (
              <div className="h-full flex flex-col p-3 transition-all duration-300">
                <div className="px-1 pb-2 pt-1 flex items-center justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'theme-text-secondary' : 'text-slate-600'}`}>Studio</h3>
                  <button
                    aria-label="Collapse studio"
                    onClick={() => setIsRightCollapsed(true)}
                    className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors ${
                      isDark
                        ? 'theme-text-muted hover:theme-muted hover:ring-1 hover:ring-[color:var(--border-primary)]'
                        : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <svg className={"w-4 h-4"} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="h-[calc(100%-40px)] overflow-y-auto p-1">
                  {/* Proper 2x2 grid layout */}
                  <div className="grid grid-cols-2 gap-4 auto-rows-[1fr]">
                    <StudioCard
                      title="Mind Map"
                      subtitle="Visualize relationships between entities and themes."
                      imageSrc="/features/mindmap.png"
                      onClick={() => handleStudioAction("Mind Map")}
                      disabled={isProcessing("Mind Map")}
                      isGenerated={!!generatedContent.mindmap}
                      buttonText="Generate"
                      isLoading={isProcessing("Mind Map")}
                    />
                    <StudioCard
                      title="Generate Podcast"
                      subtitle="Two-voice discussion based on the analysis."
                      imageSrc="/features/podcast.png"
                      onClick={() => handleStudioAction("Generate Podcast")}
                      disabled={isProcessing("Generate Podcast")}
                      isGenerated={!!generatedContent.podcast}
                      buttonText="Generate"
                      isLoading={isProcessing("Generate Podcast")}
                    />
                    <StudioCard
                      title="Generate Audio Report"
                      subtitle="Narrated full report for listening on the go."
                      imageSrc="/features/audioreport.png"
                      onClick={() => handleStudioAction("Audio Report")}
                      disabled={isProcessing("Audio Report")}
                      isGenerated={!!generatedContent.audioReport}
                      buttonText="Generate"
                      isLoading={isProcessing("Audio Report")}
                    />
                    <StudioCard
                      title="Export PDF"
                      subtitle="Export a beautifully formatted PDF."
                      imageSrc="/features/pdf.svg"
                      onClick={() => handleStudioAction("Export PDF")}
                      disabled={true}
                      isGenerated={false}
                      buttonText="Coming Soon"
                      isLoading={false}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                aria-label="Open Studio"
                onClick={() => setIsRightCollapsed(false)}
                className={`h-full w-full flex items-center justify-center transition-colors bg-transparent`}
                title="Open Studio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${isDark ? 'theme-text' : 'text-slate-700'}`}>
                  <path d="M9 17l-1.5-3.5L4 12l3.5-1.5L9 7l1.5 3.5L14 12l-3.5 1.5L9 17z" />
                  <path d="M17 4l.8 1.8L20 7l-2.2 1.2L17 10l-.8-1.8L14 7l2.2-1.2L17 4z" />
                </svg>
              </button>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ReportConsole() {
  return (
    <ReportProvider>
      <ReportConsoleContent />
    </ReportProvider>
  );
} 