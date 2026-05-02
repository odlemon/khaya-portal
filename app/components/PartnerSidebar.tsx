// @ts-nocheck
"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  isBankAdminRole,
  isInsuranceAdminRole,
} from "../lib/portals";

const insuranceNav = [
  { name: "Dashboard", path: "/insurance/dashboard" },
  { name: "Pending reviews", path: "/insurance/pending-reviews" },
];

const bankNav = [
  { name: "Dashboard", path: "/bank/dashboard" },
  { name: "Settlement queue", path: "/bank/settlement-queue" },
  { name: "Insurance settlements", path: "/bank/insurance-settlement-queue" },
];

/** Prefer URL so bank vs insurance nav stays correct if `user.role` is missing or non-canonical. */
function partnerPortalVariant(
  pathname: string | null | undefined,
  role: string | undefined
): "bank" | "insurance" {
  if (pathname?.startsWith("/bank")) return "bank";
  if (pathname?.startsWith("/insurance")) return "insurance";
  if (isInsuranceAdminRole(role)) return "insurance";
  if (isBankAdminRole(role)) return "bank";
  return "insurance";
}

function getInitials(name: string, email?: string) {
  if (!name || name.trim() === "" || name.trim() === "undefined undefined") {
    return email && email.length > 0 ? email[0].toUpperCase() : "?";
  }
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PartnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);

  const variant = partnerPortalVariant(pathname, user?.role);

  const navItems = variant === "insurance" ? insuranceNav : bankNav;
  const title =
    variant === "insurance" ? "Insurance portal" : "Bank portal";
  const subtitle =
    variant === "insurance"
      ? "Coverage & claims (partner)"
      : "Escrow & settlements (partner)";

  useEffect(() => {
    const items = partnerPortalVariant(pathname, user?.role) === "insurance" ? insuranceNav : bankNav;
    items.forEach((item) => router.prefetch(item.path));
  }, [router, pathname, user?.role]);

  const handleNavigation = useCallback(
    (path: string) => {
      setNavigating(path);
      setSidebarOpen(false);
      router.prefetch(path);
      router.push(path);
      setTimeout(() => setNavigating(null), 800);
    },
    [router]
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-xl p-3 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={
          'h-full w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ' +
          'max-md:fixed max-md:z-50 max-md:top-0 max-md:left-0 ' +
          (sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full') +
          ' md:static md:translate-x-0 md:w-64'
        }
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                variant === "insurance"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-slate-600 to-slate-800"
              }`}
            >
              <img src="/images/khaya.png" alt="Khayalami" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="px-3 py-2 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home</h3>
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                  pathname === item.path
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : navigating === item.path
                      ? "bg-gray-50 text-gray-600"
                      : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="w-5 h-5 mr-3 text-gray-500">
                  {navigating === item.path ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                    </svg>
                  )}
                </div>
                {item.name}
              </button>
            ))}
          </div>
        </nav>
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user ? getInitials(`${user.firstName || ""} ${user.lastName || ""}`, user.email) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user && user.firstName && user.lastName && user.firstName.trim() && user.lastName.trim()
                  ? `${user.firstName} ${user.lastName}`
                  : user
                    ? user.email
                    : "-"}
              </div>
              <div className="text-xs text-gray-500 truncate">{user ? user.email : "-"}</div>
            </div>
          </div>
        </div>
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
