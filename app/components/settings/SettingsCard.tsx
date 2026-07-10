// @ts-nocheck
'use client';

import React from 'react';

interface SettingsCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function SettingsCard({ children, className = '' }: SettingsCardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
