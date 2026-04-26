// @ts-nocheck

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
}
