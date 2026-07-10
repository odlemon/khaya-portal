// @ts-nocheck
'use client';

import React from 'react';

type Variant = 'default' | 'danger' | 'success' | 'warning';

interface IconActionButtonProps {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  variant?: Variant;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default: 'text-gray-600 hover:bg-gray-100 hover:text-blue-600',
  danger: 'text-gray-600 hover:bg-red-50 hover:text-red-600',
  success: 'text-gray-600 hover:bg-green-50 hover:text-green-600',
  warning: 'text-gray-600 hover:bg-amber-50 hover:text-amber-700',
};

export default function IconActionButton({
  onClick,
  title,
  disabled = false,
  variant = 'default',
  children,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}
