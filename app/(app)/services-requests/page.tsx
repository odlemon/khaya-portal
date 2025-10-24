// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminServicesService, type ServiceRequest } from '../../services/services/admin.services';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function ServicesRequestsPage() {
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; service?: ServiceRequest }>({ open: false });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; service?: ServiceRequest }>({ open: false });
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; service?: ServiceRequest }>({ open: false });

  const { getNeedingVendor, approveService, rejectService, assignVendor } = useAdminServicesService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getNeedingVendor();
        if (res?.success) setAllRequests(res.data);
        else setError('Failed to load service requests');
      } catch (e) {
        setError('Error loading service requests');
      } finally {
        setLoading(false);
      }
    })();
  }, [getNeedingVendor, authLoading]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allRequests;
    const q = search.toLowerCase();
    return allRequests.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.serviceType || '').toLowerCase().includes(q) ||
      (r.tenantId?.firstName || '').toLowerCase().includes(q) ||
      (r.tenantId?.lastName || '').toLowerCase().includes(q) ||
      (r.landlordId?.firstName || '').toLowerCase().includes(q) ||
      (r.landlordId?.lastName || '').toLowerCase().includes(q) ||
      (r.propertyId?.title || '').toLowerCase().includes(q)
    );
  }, [allRequests, search]);

  const handleApprove = async (serviceId: string, scheduledDate?: string) => {
    try {
      setActionLoadingId(serviceId);
      await approveService(serviceId, scheduledDate);
      setAllRequests(prev => prev.filter(r => r._id !== serviceId));
    } finally {
      setActionLoadingId(null);
      setApproveDialog({ open: false });
    }
  };

  const handleReject = async (serviceId: string, reason: string) => {
    try {
      setActionLoadingId(serviceId);
      await rejectService(serviceId, reason);
      setAllRequests(prev => prev.filter(r => r._id !== serviceId));
    } finally {
      setActionLoadingId(null);
      setRejectDialog({ open: false });
    }
  };

  const handleAssign = async (serviceId: string, payload: { name: string; phoneNumber?: string; company?: string; scheduledDate?: string }) => {
    try {
      setActionLoadingId(serviceId);
      await assignVendor(serviceId, payload);
      setAllRequests(prev => prev.filter(r => r._id !== serviceId));
    } finally {
      setActionLoadingId(null);
      setAssignDialog({ open: false });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Service Requests</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} awaiting scheduling or rejection</p>
          </div>
          <div className="w-full sm:w-96">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        <div className="bg-white border border-gray-200/50 rounded-2xl overflow-hidden">
          <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <div className="col-span-3">Request</div>
              <div className="col-span-2">Tenant</div>
              <div className="col-span-2">Landlord</div>
              <div className="col-span-2">Property</div>
              <div className="col-span-1">Urgency</div>
              <div className="col-span-2">Actions</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200/50">
            {filtered.map((r) => (
              <div key={r._id} className="px-4 sm:px-6 py-4">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title || r.serviceType}</p>
                    <p className="text-xs text-gray-500 truncate">Requested {r.requestedDate ? new Date(r.requestedDate).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.tenantId?.firstName} {r.tenantId?.lastName}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.landlordId?.firstName} {r.landlordId?.lastName}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.propertyId?.title}</p>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${r.urgency === 'high' ? 'bg-red-100 text-red-800' : r.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{r.urgency || 'low'}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => setApproveDialog({ open: true, service: r })}
                      disabled={actionLoadingId === r._id}
                      className={`px-3 py-2 rounded-lg text-sm text-white ${actionLoadingId === r._id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'} transition-colors`}
                    >
                      {actionLoadingId === r._id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setAssignDialog({ open: true, service: r })}
                      disabled={actionLoadingId === r._id}
                      className={`px-3 py-2 rounded-lg text-sm text-white ${actionLoadingId === r._id ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'} transition-colors`}
                    >
                      {actionLoadingId === r._id ? '...' : 'Assign Vendor'}
                    </button>
                    <button
                      onClick={() => setRejectDialog({ open: true, service: r })}
                      disabled={actionLoadingId === r._id}
                      className={`px-3 py-2 rounded-lg text-sm ${actionLoadingId === r._id ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-colors`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      {approveDialog.open && approveDialog.service && (
        <Dialog onClose={() => setApproveDialog({ open: false })}>
          <ApproveForm service={approveDialog.service} onSubmit={handleApprove} loadingId={actionLoadingId} />
        </Dialog>
      )}

      {/* Assign Vendor Dialog */}
      {assignDialog.open && assignDialog.service && (
        <Dialog onClose={() => setAssignDialog({ open: false })}>
          <AssignForm service={assignDialog.service} onSubmit={handleAssign} loadingId={actionLoadingId} />
        </Dialog>
      )}

      {/* Reject Dialog */}
      {rejectDialog.open && rejectDialog.service && (
        <Dialog onClose={() => setRejectDialog({ open: false })}>
          <RejectForm service={rejectDialog.service} onSubmit={handleReject} loadingId={actionLoadingId} />
        </Dialog>
      )}
    </div>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6">{children}</div>
        <div className="px-4 sm:px-6 py-3 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900">Close</button>
        </div>
      </div>
    </div>
  );
}

function ApproveForm({ service, onSubmit, loadingId }: { service: ServiceRequest; onSubmit: (id: string, date?: string) => Promise<void>; loadingId: string | null }) {
  const [date, setDate] = useState<string>('');
  const busy = loadingId === service._id;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Approve & Schedule</h3>
      <p className="text-sm text-gray-600">Set an optional scheduled date. If omitted, the requested date will be used.</p>
      <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <div className="flex justify-end">
        <button onClick={() => onSubmit(service._id, date || undefined)} disabled={busy} className={`px-4 py-2 rounded-lg text-white ${busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{busy ? 'Saving...' : 'Approve'}</button>
      </div>
    </div>
  );
}

function AssignForm({ service, onSubmit, loadingId }: { service: ServiceRequest; onSubmit: (id: string, payload: { name: string; phoneNumber?: string; company?: string; scheduledDate?: string }) => Promise<void>; loadingId: string | null }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [scheduledDate, setDate] = useState('');
  const busy = loadingId === service._id;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Assign Vendor (Optional)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input placeholder="Vendor Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhone(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input type="datetime-local" value={scheduledDate} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
      <div className="flex justify-end">
        <button onClick={() => onSubmit(service._id, { name, phoneNumber, company, scheduledDate: scheduledDate || undefined })} disabled={busy} className={`px-4 py-2 rounded-lg text-white ${busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{busy ? 'Saving...' : 'Assign & Schedule'}</button>
      </div>
    </div>
  );
}

function RejectForm({ service, onSubmit, loadingId }: { service: ServiceRequest; onSubmit: (id: string, reason: string) => Promise<void>; loadingId: string | null }) {
  const [reason, setReason] = useState('');
  const busy = loadingId === service._id;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Reject Service</h3>
      <textarea placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} />
      <div className="flex justify-end">
        <button onClick={() => onSubmit(service._id, reason)} disabled={busy || !reason.trim()} className={`px-4 py-2 rounded-lg ${busy ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>{busy ? 'Saving...' : 'Reject'}</button>
      </div>
    </div>
  );
}


