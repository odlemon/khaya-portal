// @ts-nocheck
import { Inter } from 'next/font/google';
import '../../globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../../context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className + ' bg-white min-h-screen'}>
      <AuthProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: { 
              fontFamily: 'inherit',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          }} 
        />
        {children}
      </AuthProvider>
    </div>
  );
} 