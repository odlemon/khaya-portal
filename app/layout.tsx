// @ts-nocheck
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Khaya Portal',
  description: 'Property management portal for tenants, landlords, and rental properties',
  openGraph: {
    title: 'Khaya Portal - Property Management',
    description: 'Property management portal for tenants, landlords, and rental properties',
    url: 'https://khaya-portal.com',
    siteName: 'Khaya Portal',
    images: [
      {
        url: 'https://khaya-portal.com/images/dashboard.png',
        width: 800,
        height: 600,
        alt: 'Khaya Portal Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khaya Portal - Property Management',
    description: 'Property management portal for tenants, landlords, and rental properties',
    images: ['https://khaya-portal.com/images/dashboard.png'],
    creator: '@khayaportal', // Optional: replace with your Twitter handle
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className + ' bg-gray-100'}>
        <AuthProvider>
          <Toaster position="top-center" toastOptions={{
            style: { fontFamily: 'inherit' },
          }} />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 