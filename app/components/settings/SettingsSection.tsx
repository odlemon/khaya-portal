// @ts-nocheck
'use client';

import React from 'react';

interface SettingsSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SettingsSection({
  title,
  subtitle,
  children,
  className = '',
}: SettingsSectionProps) {
  return (
    <div className={`p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
