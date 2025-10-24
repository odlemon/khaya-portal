// @ts-nocheck
'use client';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import '../globals.css';
import { Suspense } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{
        style: { fontFamily: 'inherit' },
      }} />
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 rounded-lg">
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
} 