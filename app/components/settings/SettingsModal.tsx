// @ts-nocheck
'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeDisabled?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function SettingsModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  closeDisabled = false,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={() => !closeDisabled && onClose()}
        aria-label="Close modal"
      />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${maxWidthClasses[maxWidth]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 id="settings-modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {!closeDisabled && (
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 text-gray-900">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-900">{label}</label>
      {children}
    </div>
  );
}

export const settingsInputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

export const settingsSelectClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
