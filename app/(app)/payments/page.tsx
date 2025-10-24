// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { usePaymentsService, type Payment } from '../../services/payments/payments.service';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const { getPayments } = usePaymentsService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await getPayments();
        if (response?.success) {
          setAllPayments(response.data);
        } else {
          setError('Failed to fetch payments');
        }
      } catch (err) {
        setError('Error loading payments');
        console.error('Error fetching payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [getPayments, authLoading]);

  // Filter payments based on search term and filters
  useEffect(() => {
    let filtered = allPayments;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(payment =>
        (payment.receiptNumber || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.tenantId?.firstName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.tenantId?.lastName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.tenantId?.email || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.landlordId?.firstName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.landlordId?.lastName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.propertyId?.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.agreementId?.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, methodFilter, allPayments]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'in_app': return 'bg-blue-100 text-blue-800';
      case 'cash': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export filtered payments to XLSX
  const handleExportXlsx = async () => {
    try {
      const XLSX = await import('xlsx');
      const rows = filteredPayments.map((p) => ({
        'Receipt Number': p.receiptNumber ?? '',
        'Payment Type': p.paymentType ?? '',
        'Amount': p.amount ?? 0,
        'Late Fee': p.lateFee ?? 0,
        'Days Late': p.daysLate ?? 0,
        'Total Amount': p.totalAmount ?? 0,
        'Status': p.status ?? '',
        'Method': p.paymentMethod ?? '',
        'Payment Date': p.paymentDate ?? '',
        'Due Date': p.dueDate ?? '',
        'Tenant Name': `${p.tenantId?.firstName ?? ''} ${p.tenantId?.lastName ?? ''}`.trim(),
        'Tenant Email': p.tenantId?.email ?? '',
        'Landlord Name': `${p.landlordId?.firstName ?? ''} ${p.landlordId?.lastName ?? ''}`.trim(),
        'Landlord Email': p.landlordId?.email ?? '',
        'Property': p.propertyId?.title ?? '',
        'Agreement': p.agreementId?.title ?? '',
        'Notes': p.notes ?? '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
      XLSX.writeFile(workbook, `payments_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Failed to export XLSX', e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* iOS-style Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payments</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-full sm:w-auto flex items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-80 lg:w-96">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
                <button
                  onClick={handleExportXlsx}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base shadow-sm"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                  </svg>
                  Export XLSX
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="verified">Verified</option>
                  <option value="overdue">Overdue</option>
                  <option value="rejected">Rejected</option>
                  <option value="disputed">Disputed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Methods</option>
                  <option value="in_app">Online</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* iOS-style Content */}
        <div className="flex-1 overflow-hidden">
          {error && (
            <div className="mx-4 sm:mx-6 mt-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4">
              <p className="text-red-800 text-sm sm:text-base">{error}</p>
            </div>
          )}

          {currentPayments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' ? 'No payments found' : 'No payments yet'}
                </h3>
                <p className="text-gray-500 text-base sm:text-lg">
                  {searchTerm || statusFilter !== 'all' || methodFilter !== 'all' ? 'Try adjusting your filters' : 'Payments will appear here once created'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {/* Mac/iOS Style Data Table */}
              <div className="bg-white border border-gray-200/50 rounded-2xl mx-4 sm:mx-6 my-4 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="col-span-3">Receipt</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2">Tenant</div>
                    <div className="col-span-2">Landlord</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Method</div>
                    <div className="col-span-1">Date</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200/50">
                  {currentPayments.map((payment, index) => (
                    <div 
                      key={payment._id} 
                      className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Receipt Number */}
                        <div className="col-span-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {payment.receiptNumber?.slice(-2) || 'PA'}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {payment.receiptNumber}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {payment.notes || 'Payment transaction'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="col-span-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(payment.totalAmount)}
                          </p>
                          {payment.lateFee > 0 && (
                            <p className="text-xs text-red-600">
                              +{formatPrice(payment.lateFee)} late fee
                            </p>
                          )}
                        </div>

                        {/* Tenant */}
                        <div className="col-span-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {payment.tenantId?.firstName?.[0]}{payment.tenantId?.lastName?.[0]}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {payment.tenantId?.firstName || 'N/A'} {payment.tenantId?.lastName || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {payment.tenantId?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Landlord */}
                        <div className="col-span-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {payment.landlordId?.firstName?.[0]}{payment.landlordId?.lastName?.[0]}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {payment.landlordId?.firstName || 'N/A'} {payment.landlordId?.lastName || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {payment.landlordId?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>

                        {/* Method */}
                        <div className="col-span-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMethodColor(payment.paymentMethod)}`}>
                            {payment.paymentMethod === 'in_app' ? 'Online' : 'Cash'}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="col-span-1">
                          <p className="text-sm text-gray-900">
                            {formatDate(payment.paymentDate)}
                          </p>
                          {payment.daysLate > 0 && (
                            <p className="text-xs text-red-600">
                              {payment.daysLate} days late
                            </p>
                          )}
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
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} payments
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* iOS-style Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-7xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedPayment.receiptNumber}</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base line-clamp-2">{selectedPayment.notes}</p>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Payment Overview */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Payment Details</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Transaction information</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                      <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getMethodColor(selectedPayment.paymentMethod)}`}>
                        {selectedPayment.paymentMethod === 'in_app' ? 'Online' : 'Cash'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Amount</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedPayment.amount)}</p>
                      <p className="text-xs text-gray-500">base amount</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Late Fee</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedPayment.lateFee)}</p>
                      <p className="text-xs text-gray-500">additional charges</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Total</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedPayment.totalAmount)}</p>
                      <p className="text-xs text-gray-500">final amount</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Payment Info */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Transaction</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Payment details</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Due Date:</span>
                        <span className="font-medium text-sm">{formatDate(selectedPayment.dueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Payment Date:</span>
                        <span className="font-medium text-sm">{formatDate(selectedPayment.paymentDate)}</span>
                      </div>
                      {selectedPayment.verifiedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Verified:</span>
                          <span className="font-medium text-sm">{formatDate(selectedPayment.verifiedAt)}</span>
                        </div>
                      )}
                      {selectedPayment.daysLate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Days Late:</span>
                          <span className="font-medium text-sm text-red-600">{selectedPayment.daysLate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gateway Response */}
                  {selectedPayment.gatewayResponse && (
                    <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base">Gateway</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Payment processor</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Provider:</span>
                          <span className="font-medium text-sm capitalize">{selectedPayment.gatewayResponse.provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Transaction ID:</span>
                          <span className="font-medium text-sm font-mono text-xs">{selectedPayment.gatewayResponse.transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Reference:</span>
                          <span className="font-medium text-sm font-mono text-xs">{selectedPayment.gatewayResponse.transactionRef}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Tenant */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {selectedPayment.tenantId?.firstName?.[0]}{selectedPayment.tenantId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Tenant</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Payment sender</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedPayment.tenantId?.firstName || 'N/A'} {selectedPayment.tenantId?.lastName || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedPayment.tenantId?.email || 'N/A'}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{selectedPayment.tenantId?.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Landlord */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {selectedPayment.landlordId?.firstName?.[0]}{selectedPayment.landlordId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Landlord</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Payment receiver</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedPayment.landlordId?.firstName || 'N/A'} {selectedPayment.landlordId?.lastName || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedPayment.landlordId?.email || 'N/A'}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{selectedPayment.landlordId?.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Property & Agreement Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Property */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Property</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Rental property</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {selectedPayment.propertyId?.title || 'N/A'}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                        {selectedPayment.propertyId?.address?.street || 'N/A'}, {selectedPayment.propertyId?.address?.city || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Agreement */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Agreement</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Rental agreement</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {selectedPayment.agreementId?.title || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Agreement ID: {selectedPayment.agreementId?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Details */}
                {(selectedPayment.verificationNotes || selectedPayment.rejectionReason) && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Verification</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Payment verification details</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {selectedPayment.verificationNotes && (
                        <div>
                          <span className="text-gray-600 text-sm">Notes:</span>
                          <p className="text-sm text-gray-700 mt-1">{selectedPayment.verificationNotes}</p>
                        </div>
                      )}
                      {selectedPayment.rejectionReason && (
                        <div>
                          <span className="text-gray-600 text-sm">Rejection Reason:</span>
                          <p className="text-sm text-red-600 mt-1">{selectedPayment.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
