// @ts-nocheck
"use client";
import { useAuth } from '../../context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import authService from '../../services/auth/auth.service'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // If Google token is present and user is not set, wait for user to be set before rendering or redirecting
  if (searchParams.get('token') && !user) return null;

  if (loading) return null;
  if (!user) return null;

  return (
    <>{children}</>
  )
} 