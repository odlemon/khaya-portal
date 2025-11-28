// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { usePaymentRequestsService, type PaymentRequest, type PaymentRequestFilters } from '@/app/services/payments/payment-requests.service';
import { useAuth } from '@/app/context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  Search,
  Filter,
  Download,
  AlertCircle,
  DollarSign,
  Building,
  User
} from 'lucide-react';

export default function PaymentRequestsPage() {
  const [allRequests, setAllRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const { getPendingRequests, approveRequest, rejectRequest } = usePaymentRequestsService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchRequests();
  }, [authLoading]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: PaymentRequestFilters = {};
      if (dateRangeFilter.start) filters.startDate = dateRangeFilter.start;
      if (dateRangeFilter.end) filters.endDate = dateRangeFilter.end;
      
      const response = await getPendingRequests(filters);
      
      if (response?.success) {
        setAllRequests(response.data);
      } else {
        setError('Failed to fetch payment requests');
      }
    } catch (err) {
      console.error('Error fetching payment requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search term and filters
  useEffect(() => {
    let filtered = allRequests;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(request =>
        request.tenantId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenantId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenantId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.landlordId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.landlordId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.propertyId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Payment method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(request => request.paymentMethod === methodFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, allRequests]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_admin_approval': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'processed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_admin_approval': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'processed': return 'Processed';
      default: return status;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'mobile_money': return 'Mobile Money';
      case 'cash': return 'Cash';
      case 'other': return 'Other';
      default: return method;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await approveRequest(id);
      
      if (response?.success) {
        setSuccessMessage('Payment request approved successfully');
        setShowModal(false);
        setSelectedRequest(null);
        await fetchRequests();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError('Failed to approve payment request');
      }
    } catch (err) {
      console.error('Error approving payment request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve payment request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      
      const response = await rejectRequest(id, rejectionReason);
      
      if (response?.success) {
        setSuccessMessage('Payment request rejected successfully');
        setShowModal(false);
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        await fetchRequests();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError('Failed to reject payment request');
      }
    } catch (err) {
      console.error('Error rejecting payment request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject payment request');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
              {authLoading ? 'Authentication is still loading. Please wait.' : 'Loading Payment Requests'}
            </h3>
            <p className="text-gray-500 text-sm">
              {authLoading ? 'Please wait while we verify your authentication...' : 'Please wait while we fetch payment requests...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Payment Requests</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Review and manage external payment requests from tenants</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {filteredRequests.length} of {allRequests.length} requests
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by tenant, landlord, or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending_admin_approval">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
              </select>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))}
                placeholder="Start Date"
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))}
                placeholder="End Date"
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mx-4 sm:mx-6 mt-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm sm:text-base">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentRequests.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' ? 'No requests found' : 'No payment requests yet'}
              </h3>
              <p className="text-gray-500 text-base sm:text-lg">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' ? 'Try adjusting your filters' : 'Payment requests will appear here once submitted by tenants'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Table */}
            <div className="bg-white border border-gray-200/50 rounded-2xl mx-4 sm:mx-6 my-4 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-3">Tenant / Property</div>
                  <div className="col-span-2">Landlord</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-2">Method</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Submitted</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200/50">
                {currentRequests.map((request) => (
                  <div 
                    key={request._id} 
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Tenant / Property */}
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.tenantId?.firstName} {request.tenantId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {request.propertyId?.title}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Landlord */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900 truncate">
                          {request.landlordId?.firstName} {request.landlordId?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {request.landlordId?.email}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="col-span-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(request.amount)}
                        </p>
                      </div>

                      {/* Method */}
                      <div className="col-span-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {getMethodLabel(request.paymentMethod)}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      {/* Submitted Date */}
                      <div className="col-span-1">
                        <p className="text-xs text-gray-900">
                          {formatDate(request.submittedAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200/60 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Payment Request Details</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                    setShowRejectionModal(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Request Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-lg text-gray-900">{formatCurrency(selectedRequest.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">{getMethodLabel(selectedRequest.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusLabel(selectedRequest.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedRequest.submittedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Tenant Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedRequest.tenantId?.firstName} {selectedRequest.tenantId?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedRequest.tenantId?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Landlord Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Landlord Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedRequest.landlordId?.firstName} {selectedRequest.landlordId?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedRequest.landlordId?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h4>
                  <div>
                    <p className="text-sm text-gray-500">Property Title</p>
                    <p className="font-medium text-gray-900">{selectedRequest.propertyId?.title}</p>
                    <p className="text-sm text-gray-500 mt-2">Address</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.propertyId?.address?.street}, {selectedRequest.propertyId?.address?.city}, {selectedRequest.propertyId?.address?.country}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedRequest.notes && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes</h4>
                    <p className="text-sm text-gray-900">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedRequest.rejectionReason && (
                  <div className="bg-red-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-red-900 mb-4">Rejection Reason</h4>
                    <p className="text-sm text-red-800">{selectedRequest.rejectionReason}</p>
                  </div>
                )}

                {/* Proof of Payment */}
                {selectedRequest.proofOfPayment && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Proof of Payment</h4>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <a
                        href={selectedRequest.proofOfPayment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        <Download className="w-4 h-4" />
                        View Proof of Payment
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedRequest.status === 'pending_admin_approval' && (
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowRejectionModal(true);
                      }}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors duration-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to approve this payment request? This will add the payment to escrow.')) {
                          handleApprove(selectedRequest._id);
                        }
                      }}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors duration-200 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reject Payment Request</h3>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This reason will be sent to the tenant.</p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (rejectionReason.trim()) {
                        handleReject(selectedRequest._id);
                      } else {
                        setError('Please provide a reason for rejection');
                      }
                    }}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors duration-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





