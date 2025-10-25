// @ts-nocheck
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { usePermissions } from "../services/permissions/usePermissions";
import authService from "../services/auth/auth.service";
import type { UserDetailsData } from "../services/auth/types";
import { useAuth } from '../context/AuthContext';

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6",
  },
  // Property Management
  {
    name: "Tenants",
    path: "/tenants",
    permission: "view_tenants",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M17 20a4 4 0 00-3-3.87M9 20a4 4 0 013-3.87M12 3v17m0 0a4 4 0 01-4-4V7a4 4 0 014-4zm0 0a4 4 0 014 4v9a4 4 0 01-4 4z",
  },
  {
    name: "Landlords",
    path: "/landlords",
    permission: "view_landlords",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    name: "Properties",
    path: "/properties",
    permission: "view_properties",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
  },
  {
    name: "Agreements",
    path: "/agreements",
    permission: "view_agreements",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  // Payments
  {
    name: "Payments",
    path: "/payments",
    permission: "view_payments",
    icon: "M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z",
  },
  {
    name: "Earnings",
    path: "/earnings",
    permission: "view_earnings",
    icon: "M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z",
  },
  {
    name: "Incoming Requests",
    path: "/incoming-requests",
    permission: "view_verification_requests",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  // Communication
  {
    name: "Messages",
    path: "/messages",
    permission: "view_chats",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  // Maintenance & Services
  {
    name: "Vendors",
    path: "/vendors",
    permission: "view_vendors",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    name: "Maintenance",
    path: "/maintenance-requests",
    permission: "view_maintenance",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

function getInitials(name: string, email?: string) {
  if (!name || name.trim() === '' || name.trim() === 'undefined undefined') {
    return email && email.length > 0 ? email[0].toUpperCase() : '?';
  }
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Define unique SVG icons for each sidebar item
const sidebarIcons = {
  dashboard: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
  ),
  tenants: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M17 20h5v-2a4 4 0 00-3-3.87" />
      <path d="M9 20H4v-2a4 4 0 013-3.87" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  landlords: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  properties: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    </svg>
  ),
  payments: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 8v8m0 0l-3-3m3 3l3-3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  agreements: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  messages: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  vendors: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  maintenance: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  earnings: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
    </svg>
  ),
  incomingRequests: (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Helper to map menu item name to sidebarIcons key
const getSidebarIcon = (name: string) => {
  switch (name) {
    case 'Dashboard': return sidebarIcons.dashboard;
    case 'Tenants': return sidebarIcons.tenants;
    case 'Landlords': return sidebarIcons.landlords;
    case 'Properties': return sidebarIcons.properties;
    case 'Agreements': return sidebarIcons.agreements;
    case 'Payments': return sidebarIcons.payments;
    case 'Earnings': return sidebarIcons.earnings;
    case 'Incoming Requests': return sidebarIcons.incomingRequests;
    case 'Messages': return sidebarIcons.messages;
    case 'Vendors': return sidebarIcons.vendors;
    case 'Maintenance': return sidebarIcons.maintenance;
    default: return null;
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, loading: permissionsLoading, ready: permissionsReady } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // State for navigation loading
  const [navigating, setNavigating] = useState<string | null>(null);

  // Super aggressive prefetching strategy
  useEffect(() => {
    const prefetchAllRoutes = async () => {
      // Prefetch ALL routes immediately in batches
      const allPaths = menuItems.map(item => item.path).filter(Boolean);
      
      // Batch 1: Critical routes (immediate)
      const criticalPaths = [
        '/dashboard',
        '/billing',
        '/settings/account'
      ];
      
      criticalPaths.forEach(path => {
        if (allPaths.includes(path)) {
          router.prefetch(path);
        }
      });

      // Batch 2: All other routes (staggered every 10ms)
      const remainingPaths = allPaths.filter(path => !criticalPaths.includes(path));
      remainingPaths.forEach((path, index) => {
        setTimeout(() => {
          router.prefetch(path);
        }, index * 10);
      });
    };

    prefetchAllRoutes();
  }, [router]);

  // Additional prefetching on hover with higher priority
  const handleMouseEnter = useCallback((path: string) => {
    // Force prefetch again on hover to ensure it's ready
    router.prefetch(path);
    
    // Also preload any critical resources
    if (typeof window !== 'undefined') {
      // Preload DNS for any external resources
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = window.location.origin;
      document.head.appendChild(link);
    }
  }, [router]);

  // Ultra-fast navigation with visual feedback
  const handleNavigation = useCallback((path: string) => {
    // Set loading state immediately
    setNavigating(path);
    
    // Close mobile sidebar
    setSidebarOpen(false);
    
    // Force prefetch one more time
    router.prefetch(path);
    
    // Navigate immediately - don't wait
    router.push(path);
    
    // Clear loading state after navigation
    setTimeout(() => {
      setNavigating(null);
    }, 1000);
  }, [router]);

  if (permissionsLoading || !permissionsReady) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col relative">
        <div className="px-6 py-4">
          <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        <nav className="flex-1 px-4 py-4">
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </nav>
        <div className="px-4 pb-4">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </aside>
    );
  }

  // Responsive sidebar overlay for mobile
  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-xl p-3 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Sidebar overlay for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* iOS-style header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <img src="/images/logo/logo.png" alt="Logo" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Khaya Portal</h1>
              <p className="text-xs text-gray-500">Property Management</p>
            </div>
          </div>
        </div>
        {/* Main nav */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Home section */}
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home</h3>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation(menuItems[0].path)}
                  onMouseEnter={() => handleMouseEnter(menuItems[0].path)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                    pathname === menuItems[0].path
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 mr-3 ${
                    pathname === menuItems[0].path ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {getSidebarIcon(menuItems[0].name)}
                  </div>
                  {menuItems[0].name}
                </button>
              </div>
            </div>

            {/* Property Management section */}
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Management</h3>
              </div>
              <div className="space-y-1">
                {menuItems.slice(1, 5).map((item) => {
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      onMouseEnter={() => handleMouseEnter(item.path)}
                      disabled={navigating === item.path}
                      className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                        pathname === item.path
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : navigating === item.path
                          ? 'bg-gray-50 text-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 mr-3 ${
                        pathname === item.path ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {navigating === item.path ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          getSidebarIcon(item.name)
                        )}
                      </div>
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payments section */}
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payments</h3>
              </div>
              <div className="space-y-1">
                {menuItems.slice(5, 7).map((item) => {
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      onMouseEnter={() => handleMouseEnter(item.path)}
                      disabled={navigating === item.path}
                      className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                        pathname === item.path
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : navigating === item.path
                          ? 'bg-gray-50 text-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 mr-3 ${
                        pathname === item.path ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {navigating === item.path ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          getSidebarIcon(item.name)
                        )}
                      </div>
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Communication section */}
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Communication</h3>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation(menuItems[7].path)}
                  onMouseEnter={() => handleMouseEnter(menuItems[7].path)}
                  disabled={navigating === menuItems[7].path}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                    pathname === menuItems[7].path || pathname?.startsWith('/chats')
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : navigating === menuItems[7].path
                      ? 'bg-gray-50 text-gray-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 mr-3 ${
                    pathname === menuItems[7].path || pathname?.startsWith('/chats') ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {navigating === menuItems[7].path ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      getSidebarIcon(menuItems[7].name)
                    )}
                  </div>
                  {menuItems[7].name}
                </button>
              </div>
            </div>

            {/* Maintenance & Services section */}
            <div>
              <div className="px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Maintenance & Services</h3>
              </div>
              <div className="space-y-1">
                {menuItems.slice(8, 10).map((item) => {
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      onMouseEnter={() => handleMouseEnter(item.path)}
                      disabled={navigating === item.path}
                      className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                        pathname === item.path
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : navigating === item.path
                          ? 'bg-gray-50 text-gray-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 mr-3 ${
                        pathname === item.path ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {navigating === item.path ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          getSidebarIcon(item.name)
                        )}
                      </div>
                      {item.name}
                    </button>
                  );
                })}
                {/* Service Requests link */}
                <button
                  onClick={() => handleNavigation('/services-requests')}
                  onMouseEnter={() => handleMouseEnter('/services-requests')}
                  disabled={navigating === '/services-requests'}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                    pathname === '/services-requests'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : navigating === '/services-requests'
                      ? 'bg-gray-50 text-gray-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 mr-3 ${
                    pathname === '/services-requests' ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {navigating === '/services-requests' ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2h-3.5L12 3 10.5 5H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  Service Requests
                </button>
              </div>
            </div>
          </div>
        </nav>
        {/* User info at the bottom */}
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`, user.email) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user && user.firstName && user.lastName && user.firstName.trim() && user.lastName.trim() 
                  ? `${user.firstName} ${user.lastName}` 
                  : user ? user.email : "-"
                }
              </div>
              <div className="text-xs text-gray-500 truncate">{user ? user.email : "-"}</div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          className="absolute top-4 right-4 md:hidden bg-gray-100 rounded-xl p-2 hover:bg-gray-200 transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </aside>
    </>
  );
}