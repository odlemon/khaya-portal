// @ts-nocheck
import React from 'react';

export default function MetricCard({ title, value, subtitle, color }: { title: string; value: React.ReactNode; subtitle?: string; color?: string }) {
  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow px-6 py-5 min-w-[180px]">
      <span className="text-gray-500 text-sm font-medium mb-1">{title}</span>
      <span className={`text-2xl font-extrabold ${color || 'text-gray-900'}`}>{value}</span>
      {subtitle && <span className="text-xs text-gray-400 mt-1">{subtitle}</span>}
    </div>
  );
} 