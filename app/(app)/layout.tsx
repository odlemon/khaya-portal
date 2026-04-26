// @ts-nocheck
'use client';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import RolePortalGuard from '../components/RolePortalGuard';
import { Suspense } from 'react';

/** Auth + Toaster live in app/layout.tsx only — avoid duplicate providers / toast portals. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RolePortalGuard>
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
    </RolePortalGuard>
  );
} 