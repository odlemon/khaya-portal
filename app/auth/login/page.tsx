// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import authService from '../../services/auth/auth.service';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getDefaultPathForRole } from '../../lib/portals';
import { toSessionUser } from '../../lib/authUser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { login: authLogin, user, token, loading: authLoading } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) return;
    if (!pathname?.startsWith('/auth')) return;
    router.replace(getDefaultPathForRole(user.role));
  }, [authLoading, user, token, router, pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const t = res.data?.token || res.token;
      const u = res.data?.user || res.user;
      if (res.success && t && u) {
        const sessionUser = toSessionUser(u);
        authLogin({ token: t, user: sessionUser });
      } else {
        setError(res.message || 'Login failed');
        toast.error(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10">
          <div className="mb-8">
            <img
              src="/images/khaya.png"
              alt="Khayalami"
              className="mx-auto h-14 w-auto max-w-[220px] object-contain"
            />
          </div>
          <h2 className="text-center text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-500 font-medium">Sign in to your account</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-white/80 backdrop-blur-xl py-8 px-8 shadow-2xl rounded-3xl border border-gray-100/50 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center py-3 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
