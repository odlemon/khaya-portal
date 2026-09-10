// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  rentedUnitsService,
  type RentedUnit,
  type ReminderRow,
} from '../../services/rentedUnits/rentedUnits.service';
import { useAuth } from '../../context/AuthContext';
import PagePermissionWrapper from '../../components/PagePermissionWrapper';

export const dynamic = 'force-dynamic';

function addressText(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const a = address as Record<string, string>;
    return [a.street, a.area, a.city, a.country].filter(Boolean).join(', ');
  }
  return '';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RentedUnitsPage() {
  const [units, setUnits] = useState<RentedUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, ReminderRow[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        setLoading(true);
        setUnits(await rentedUnitsService.listUnits());
      } catch (err) {
        console.error('Error loading rented units:', err);
        setError('Could not load rented units');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  const toggleReminders = async (rentalId: string) => {
    if (expanded === rentalId) {
      setExpanded(null);
      return;
    }
    setExpanded(rentalId);
    if (reminders[rentalId]) return;
    try {
      const rows = await rentedUnitsService.listReminders(rentalId);
      setReminders((prev) => ({ ...prev, [rentalId]: rows }));
    } catch (err) {
      console.error('Error loading reminders:', err);
      toast.error('Could not load reminder history');
    }
  };

  const startChat = async (unit: RentedUnit, who: 'tenant' | 'landlord') => {
    const party = who === 'tenant' ? unit.tenant : unit.landlord;
    if (!party || !unit.property) {
      toast.error(`No ${who} on this unit`);
      return;
    }
    const key = `${unit.rentalId}:${who}`;
    try {
      setBusy(key);
      const chatId = await rentedUnitsService.startChat(party.id, unit.property.id);
      toast.success(`Chat opened with ${party.name || who}`);
      router.push(`/chats/${chatId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error(`Could not open a chat with the ${who}`);
    } finally {
      setBusy(null);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? units.filter((u) =>
        [u.property?.title, u.tenant?.name, u.landlord?.name, u.tenant?.email]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      )
    : units;

  return (
    <PagePermissionWrapper>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Rented units</h1>
          <p className="mt-1 text-sm text-gray-500">
            Properties currently occupied. Start a conversation with either party, and check what
            reminders they have already been sent before following up.
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property, tenant or landlord"
          className="mb-5 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />

        {loading && <p className="text-sm text-gray-500">Loading rented units…</p>}
        {error && !loading && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-gray-500">No occupied units right now.</p>
        )}

        <div className="space-y-4">
          {visible.map((unit) => {
            const isOpen = expanded === unit.rentalId;
            const rows = reminders[unit.rentalId];
            return (
              <div
                key={unit.rentalId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900">
                      {unit.property?.title || 'Untitled property'}
                    </h2>
                    <p className="text-sm text-gray-500">{addressText(unit.property?.address)}</p>
                    <p className="mt-2 text-sm text-gray-700">
                      ${unit.monthlyRent ?? 0}/mo · next payment {formatDate(unit.nextPaymentDue)}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                    {unit.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {(['tenant', 'landlord'] as const).map((who) => {
                    const party = who === 'tenant' ? unit.tenant : unit.landlord;
                    const key = `${unit.rentalId}:${who}`;
                    return (
                      <div key={who} className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{who}</p>
                        <p className="font-medium text-gray-900">{party?.name || '—'}</p>
                        <p className="truncate text-sm text-gray-500">{party?.email || ''}</p>
                        <button
                          type="button"
                          disabled={!party || busy === key}
                          onClick={() => startChat(unit, who)}
                          className="mt-2 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          {busy === key ? 'Opening…' : `Message ${who}`}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => toggleReminders(unit.rentalId)}
                    className="text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    {isOpen ? 'Hide' : 'Show'} reminders sent ({unit.reminders?.total ?? 0})
                    {unit.reminders?.lastSentAt
                      ? ` · last ${formatDate(unit.reminders.lastSentAt)}`
                      : ''}
                  </button>

                  {isOpen && (
                    <div className="mt-3">
                      {!rows && <p className="text-sm text-gray-500">Loading…</p>}
                      {rows && rows.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Nothing has been sent to this tenant yet.
                        </p>
                      )}
                      {rows && rows.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                                <th className="py-2 pr-4">Sent</th>
                                <th className="py-2 pr-4">Reminder</th>
                                <th className="py-2 pr-4">Detail</th>
                                <th className="py-2">Read</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                  <td className="whitespace-nowrap py-2 pr-4 text-gray-600">
                                    {formatDate(r.sentAt)}
                                  </td>
                                  <td className="py-2 pr-4 font-medium text-gray-900">{r.label}</td>
                                  <td className="py-2 pr-4 text-gray-600">{r.detail}</td>
                                  <td className="py-2 text-gray-600">
                                    {r.read === null ? '—' : r.read ? 'Yes' : 'No'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PagePermissionWrapper>
  );
}
