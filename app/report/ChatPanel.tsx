"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTheme } from "../components/ThemeToggle";
import { Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  showHeader?: boolean;
  reportData?: any;
}

export default function ChatPanel({ showHeader = false, reportData }: ChatPanelProps) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Ask questions about the analysis or request follow‑ups here." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Resolve user and job, then load existing chat history from Supabase
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id || null;
        setUserId(uid);
        const currentJobId = (reportData as any)?.jobId || (typeof window !== "undefined" ? localStorage.getItem("currentJobId") : null);
        setJobId(currentJobId);

        if (uid && currentJobId) {
          const { data: rows, error } = await supabase
            .from("user_chats")
            .select("role, content, created_at")
            .eq("user_id", uid)
            .eq("job_id", currentJobId)
            .order("created_at", { ascending: true });

          if (!error && rows && rows.length > 0) {
            const loaded: ChatMessage[] = rows.map((r: any) => ({ role: r.role, content: r.content }));
            setMessages(loaded);
          }
        }
      } catch (e) {
        // ignore load errors
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportData]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Persist user's message immediately if we can
      if (userId && jobId) {
        await supabase.from("user_chats").insert([{ user_id: userId, job_id: jobId, role: "user", content: userMsg.content }]);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          reportData: reportData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);

      // Persist assistant reply
      if (userId && jobId && data?.message?.content) {
        await supabase.from("user_chats").insert([{ user_id: userId, job_id: jobId, role: "assistant", content: data.message.content }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className={`border-b px-4 py-3 text-sm font-semibold ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-700'}`}>Chat</div>
      )}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-2 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
            m.role === "user" 
              ? `ml-auto ${isDark ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}` 
              : `${isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-800'}`
          }`}>
            {m.content}
          </div>
        ))}
        {isLoading && (
          <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-800'}`}>
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
              <span className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-500'}`}>Thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message..."
            disabled={isLoading}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm leading-none focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'border-slate-600 bg-slate-900 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400/50' 
                : 'border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={send}
            disabled={isLoading || !input.trim()}
            aria-label="Send"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-black hover:bg-slate-900'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}