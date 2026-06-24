import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../lib/api/client.js';
import { refreshClient } from '../lib/api/refreshClient.js';
import { tokenStore } from '../auth/tokenStore.js';
import { toast } from 'sonner';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
}

export interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (val: boolean) => void;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (googleAccessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const queryClient = useQueryClient();

  // Computes session object for compatibility with components referencing it
  const session: Session | null = user
    ? { user, access_token: tokenStore.get() || '' }
    : null;

  const handleSessionExpired = () => {
    tokenStore.clear();
    queryClient.clear();
    setUser(null);
    toast.error('Session expired, please sign in again.');
  };

  useEffect(() => {
    // 1. Listen for session expiry event from Axios client
    window.addEventListener('auth-session-expired', handleSessionExpired);

    // 2. Bootstrap session on initial load
    const bootstrap = async () => {
      try {
        const { data: refresh } = await refreshClient.post('/auth/refresh');
        const token = refresh.data.accessToken;
        tokenStore.set(token);

        const { data: me } = await client.get('/users/me');
        setUser(me.data);
      } catch {
        // No valid session
        tokenStore.clear();
        queryClient.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      window.removeEventListener('auth-session-expired', handleSessionExpired);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      queryClient.clear();
      const { data } = await client.post('/auth/login', { email, password });
      const token = data.data.accessToken;
      tokenStore.set(token);
      setUser(data.data.user);
      toast.success('Signed in successfully');
    } catch (error) {
      let message = 'Invalid email or password';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message || message;
      }
      toast.error(message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await client.post('/auth/register', { email, password });
      toast.success('Registration successful! Please log in.');
    } catch (error) {
      let message = 'Failed to register';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message || message;
      }
      toast.error(message);
      throw error;
    }
  };

  const signInWithGoogle = async (googleAccessToken: string) => {
    try {
      queryClient.clear();
      const { data } = await client.post('/auth/google', { accessToken: googleAccessToken });
      const token = data.data.accessToken;
      tokenStore.set(token);
      setUser(data.data.user);
      toast.success('Signed in successfully');
    } catch (error) {
      let message = 'Failed to sign in with Google';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message || message;
      }
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Ignore errors on signout
    } finally {
      tokenStore.clear();
      queryClient.clear();
      setUser(null);
      toast.success('Signed out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isRecoveryMode,
        setIsRecoveryMode,
        signOut,
        signIn,
        signUp,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
