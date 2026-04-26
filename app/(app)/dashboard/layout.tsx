// @ts-nocheck
"use client";
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace('/auth/login');
    }
  }, [loading, token, router]);

  if (loading) {
    return null;
  }
  if (!token) {
    return null;
  }

  return <>{children}</>
}
