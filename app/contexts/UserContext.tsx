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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[Auth] Session check error:', error);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          try {
            // Get user profile data with timeout
            const { data: profile, error: profileError } = await Promise.race([
              supabase
                .from('user_profiles')
                .select('name, avatar_url')
                .eq('id', session.user.id)
                .single(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              )
            ]);

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.warn('[Auth] Profile fetch error:', profileError);
            }

            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || '',
              avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || undefined,
            };

            setUser(userData);
            if (typeof window !== 'undefined') localStorage.setItem('sb-user-id', session.user.id);
          } catch (profileError) {
            console.warn('[Auth] Profile loading failed, using basic user data');
            // Use basic user data even if profile fetch fails
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || '',
              avatarUrl: session.user.user_metadata?.avatar_url || undefined,
            });
          }
        }
      } catch (error) {
        console.error('[Auth] Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: profile, error: profileError } = await Promise.race([
                supabase
                  .from('user_profiles')
                  .select('name, avatar_url')
                  .eq('id', session.user.id)
                  .single(),
                new Promise<any>((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
                )
              ]);

              if (profileError && profileError.code !== 'PGRST116') {
                console.warn('[Auth] Profile fetch error in auth change:', profileError);
              }

              const userData = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.user_metadata?.name || '',
                avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url || undefined,
              };

              setUser(userData);
              console.log('[Auth] User profile loaded in auth change');
            } catch (profileError) {
              console.warn('[Auth] Profile loading failed in auth change, using basic data:', profileError);
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || '',
                avatarUrl: session.user.user_metadata?.avatar_url || undefined,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[Auth] User signed out');
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed');
            // Don't reload user data on token refresh if we already have it
          }
        } catch (error) {
          console.error('[Auth] Error in auth state change:', error);
        } finally {
          setIsLoading(false);
        }
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