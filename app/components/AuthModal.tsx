"use client";

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Online avatar options (DiceBear) for quick selection
  // Human-style avatars (DiceBear Adventurer) with a balanced mix of skin tones
  const avatarOptions = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&radius=50&backgroundColor=e5e7eb&skinColor=f2d3b1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor&radius=50&backgroundColor=d1fae5&skinColor=f1c27d',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan&radius=50&backgroundColor=fee2e2&skinColor=e0ac69',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Riley&radius=50&backgroundColor=ede9fe&skinColor=c68642',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Casey&radius=50&backgroundColor=fff7ed&skinColor=a1665e',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&radius=50&backgroundColor=ecfeff&skinColor=8d5524',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Quinn&radius=50&backgroundColor=fef3c7&skinColor=e0ac69',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan&radius=50&backgroundColor=ede9fe&skinColor=c68642',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Robin&radius=50&backgroundColor=e0f2fe&skinColor=f2d3b1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Jamie&radius=50&backgroundColor=fae8ff&skinColor=7a4b2a',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Avery&radius=50&backgroundColor=f1f5f9&skinColor=8d5524',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Dakota&radius=50&backgroundColor=fee2e2&skinColor=f1c27d'
  ];
  const [avatar, setAvatar] = useState<string>(avatarOptions[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const waitForSession = async (maxMs = 4000) => {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) return session.user;
          await new Promise(r => setTimeout(r, 200));
        }
        return null;
      };

      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        // Force refresh session cookie on client in case of edge runtime delays
        await supabase.auth.refreshSession();
        const user = data.user || (await waitForSession());
        if (user) { onAuthSuccess(user); onClose(); }
        else throw new Error('Sign-in succeeded but session not established. Please try again.');
      } else {
        // Sign up through server route (no email confirmation)
        const resp = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, avatar_url: avatar })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || 'Signup failed');

        // Immediately sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.auth.refreshSession();
        const user = data.user || (await waitForSession());
        if (user) { onAuthSuccess(user); onClose(); }
        else throw new Error('Account created but session not established. Please sign in again.');
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {isLogin ? 'Sign in to access your analyses' : 'Join to save and track your analyses'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Choose an avatar
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {avatarOptions.map((src) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => setAvatar(src)}
                      className={`h-12 w-12 rounded-full overflow-hidden ring-2 transition ${avatar === src ? 'ring-slate-900' : 'ring-transparent hover:ring-slate-300'}`}
                    >
                      <img src={src} alt="avatar" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <input type="hidden" name="avatar" value={avatar} />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-slate-900 font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;