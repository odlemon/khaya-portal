// @ts-nocheck
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { filterNav } from "../lib/rbac";
import { bankNavItems, insuranceNavItems } from "../config/nav.config";
import { isBankAdminRole, isInsuranceAdminRole } from "../lib/portals";

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
  const { user, permissions, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);

  const variant = partnerPortalVariant(pathname, user?.role);

  const navItems = useMemo(() => {
    const base = variant === "insurance" ? [...insuranceNavItems] : [...bankNavItems];
    return filterNav(base, { permissions, isSuperAdmin });
  }, [variant, permissions, isSuperAdmin]);

  const title = variant === "insurance" ? "Insurance portal" : "Bank portal";
  const subtitle =
    variant === "insurance"
      ? "Coverage & claims (partner)"
      : "Escrow & settlements (partner)";

  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.path));
    router.prefetch("/settings/account");
  }, [router, navItems]);

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
        className={`fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:static md:translate-x-0 md:w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigation(item.path)}
                disabled={navigating === item.path}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                  pathname === item.path || pathname?.startsWith(item.path + "/")
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNavigation("/settings/account")}
              disabled={navigating === "/settings/account"}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                pathname === "/settings/account" || pathname?.startsWith("/settings")
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Settings
            </button>
          </div>
        </nav>
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user ? getInitials(`${user.firstName || ""} ${user.lastName || ""}`, user.email) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "-"}
              </div>
              <div className="text-xs text-gray-500 truncate">{user?.email || "-"}</div>
            </div>
          </div>
        </div>
        <button
          className="absolute top-4 right-4 md:hidden bg-gray-100 rounded-xl p-2"
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
