"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user profile data
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, avatar_url')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || '',
            avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || undefined,
          });
          if (typeof window !== 'undefined') localStorage.setItem('sb-user-id', session.user.id);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, avatar_url')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.name || session.user.user_metadata?.name || '',
            avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || undefined,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, signOut, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};