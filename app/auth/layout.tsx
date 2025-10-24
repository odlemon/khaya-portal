// @ts-nocheck
import { Inter } from 'next/font/google';
import '../globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className + ' bg-gray-100'}>
        <AuthProvider>
          <Toaster position="top-center" toastOptions={{
            style: { fontFamily: 'inherit' },
          }} />
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
} 