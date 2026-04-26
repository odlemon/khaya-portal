// @ts-nocheck
import { Suspense } from 'react';

/**
 * Auth routes share the root app/layout <html>/<body>, AuthProvider, and Toaster.
 * Do not nest another document here — invalid DOM causes removeChild / hydration errors.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
