// @ts-nocheck
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthResponse } from "../services/auth/types";
import { useSearchParams } from 'next/navigation';
import authService from '../services/auth/auth.service';
import { socketService } from '../lib/socket';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firmName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT and check expiry
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore from localStorage and check for token in URL
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
        
        if (storedToken && storedUser) {
          // Check token expiry before setting
          if (isTokenExpired(storedToken)) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            setLoading(false);
            return;
          }
          setToken(storedToken);
          try {
            setUser(JSON.parse(storedUser));
            // Connect socket with stored token
            socketService.connect(storedToken);
          } catch {
            setUser(null);
          }
        } else {
          // Check for token in URL (Google auth)
          const urlParams = new URLSearchParams(window.location.search);
          const tokenFromUrl = urlParams.get('token');
          
          if (tokenFromUrl) {
            try {
              const me = await authService.getMe(tokenFromUrl);
              if (me.success && me.data) {
                const userData = {
                  id: me.data.userId,
                  email: me.data.email,
                  firstName: me.data.firstName,
                  lastName: me.data.lastName,
                  firmName: me.data.firm?.name || '',
                  role: me.data.role,
                };
                login({ token: tokenFromUrl, user: userData });
                return; // Don't set loading to false here, let login() handle it
              }
            } catch (e) {
              console.error('Failed to process token from URL:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (data: { token: string; user: User }) => {
    setUser(data.user);
    setToken(data.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
    }
    // Connect socket on login
    socketService.connect(data.token);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    // Disconnect socket on logout
    socketService.disconnect();
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
} 