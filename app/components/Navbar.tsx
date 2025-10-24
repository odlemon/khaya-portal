// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useFetchWithAuth } from '../context/fetchWithAuth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

// Helper to get initials safely
function getInitials(user: any) {
  if (!user) return '';
  const first = typeof user.firstName === 'string' && user.firstName.length > 0 ? user.firstName[0] : '';
  const last = typeof user.lastName === 'string' && user.lastName.length > 0 ? user.lastName[0] : '';
  return `${first}${last}`.toUpperCase();
}

function decodeJWT(token: string): any {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { token, logout } = useAuth();
  const fetchWithAuth = useFetchWithAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLanding = pathname === '/';

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    // Try to fetch user details from API, fallback to decoding token
    async function fetchUserDetails() {
      try {
        // If you have an endpoint, use it:
        // const res = await fetchWithAuth('/auth/me');
        // if (res.ok) {
        //   const data = await res.json();
        //   setUser(data);
        //   return;
        // }
        // Fallback: decode token
        if (typeof token === 'string') {
          const decoded = decodeJWT(token);
          setUser(decoded);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUserDetails();
  }, [token]);

  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    setIsProfileOpen(false);
    // Add a slight delay to ensure the overlay is visible before redirect
    setTimeout(() => {
      router.replace('/auth/login');
    }, 600);
  };

  return (
    <>
      {loggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-xl shadow-lg">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-lg font-medium text-gray-700">Logging out...</span>
          </div>
        </div>  
      )}  
      <header className={`${isLanding ? 'bg-blue-200' : 'bg-white'} shadow-sm border-b border-gray-100`}>
        <div className="flex items-center justify-end px-4 md:px-8 py-3 md:py-4">
          {/* Right Side Actions */}
          <div className="flex items-center">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none group bg-white rounded-md px-2 py-1 shadow-sm hover:shadow-md transition"
              >
                {/* Avatar with accent ring */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary/30 group-hover:ring-primary/60 transition">
                  {getInitials(user)}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition">{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
                  {user?.email && <span className="text-xs text-gray-400">{user.email}</span>}
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-fade-in">
                  <a
                    href="/settings/account"
                    className="block px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                  >
                    Profile
                  </a>
                  <div className="border-t border-gray-100 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
} 