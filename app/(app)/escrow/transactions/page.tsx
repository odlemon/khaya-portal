// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useEscrowService } from '@/app/services/escrow/escrow.service';
import { useAuth } from '@/app/context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  ArrowLeft,
  Building,
  User,
  FileText,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  _id: string;
  transactionType: string;
  transactionCategory: string;
  paymentId?: { _id: string; amount?: number };
  rentalId?: string;
  propertyId?: { _id: string; title: string };
  landlordId?: { _id: string; firstName: string; lastName?: string };
  tenantId?: { _id: string; firstName: string; lastName?: string };
  payerId?: { _id: string; firstName: string; role?: string };
  recipientId?: string;
  amount: number;
  totalAmount?: number;
  landlordAmount?: number;
  khayalamiAmount?: number;
  deductions?: {
    subscriptionFee?: number;
    processingFee?: number;
    insurancePremium?: number;
    totalDeductions?: number;
  };
  paymentMethod?: string;
  paymentType?: string;
  sourceType?: string;
  status: string;
  createdAt: string;
  description: string;
  source: 'escrow' | 'revenue';
}

export default function EscrowTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { getEscrowTransactions, getTransactionsSummary } = useEscrowService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchData();
  }, [authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (dateRangeFilter.start) filters.startDate = dateRangeFilter.start;
      if (dateRangeFilter.end) filters.endDate = dateRangeFilter.end;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.transactionType = typeFilter;

      const [transactionsResponse, summaryResponse] = await Promise.all([
        getEscrowTransactions(filters),
        getTransactionsSummary()
      ]);
      
      if (transactionsResponse?.success) {
        // Handle both array and object with data property
        const transactionsData = Array.isArray(transactionsResponse.data) 
          ? transactionsResponse.data 
          : transactionsResponse.data?.data || transactionsResponse.data || [];
        setTransactions(transactionsData);
      }
      
      if (summaryResponse?.success) {
        setSummary(summaryResponse.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.propertyId?.title?.toLowerCase().includes(searchLower) ||
        transaction.landlordId?.firstName?.toLowerCase().includes(searchLower) ||
        transaction.landlordId?.lastName?.toLowerCase().includes(searchLower) ||
        transaction.tenantId?.firstName?.toLowerCase().includes(searchLower) ||
        transaction.tenantId?.lastName?.toLowerCase().includes(searchLower) ||
        transaction.payerId?.firstName?.toLowerCase().includes(searchLower) ||
        transaction._id.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Source filter
    if (sourceFilter !== 'all' && transaction.source !== sourceFilter) {
      return false;
    }

    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'held': return 'bg-blue-100 text-blue-700';
      case 'distributed': return 'bg-green-100 text-green-700';
      case 'collected': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rent_payment': return 'Rent Payment';
      case 'landlord_subscription': return 'Landlord Subscription';
      case 'tenant_subscription': return 'Tenant Subscription';
      case 'premium_boost': return 'Premium Boost';
      case 'processing_fee': return 'Processing Fee';
      case 'agreement_fee': return 'Agreement Fee';
      case 'insurance_commission': return 'Insurance Commission';
      case 'service_fee': return 'Service Fee';
      default: return type;
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
              {authLoading ? 'Authentication is still loading. Please wait.' : 'Loading Transactions'}
            </h3>
            <p className="text-gray-500 text-sm">
              {authLoading ? 'Please wait while we verify your authentication...' : 'Please wait while we fetch transactions...'}
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
          <div className="flex items-center gap-4">
            <Link
              href="/escrow"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">All Transactions</h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1">View and manage all escrow and revenue transactions</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {filteredTransactions.length} of {summary?.total || transactions.length} transactions
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
                  placeholder="Search by description, property, landlord, tenant..."
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
                <option value="pending">Pending</option>
                <option value="held">Held</option>
                <option value="distributed">Distributed</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="rent_payment">Rent Payment</option>
                <option value="landlord_subscription">Landlord Subscription</option>
                <option value="tenant_subscription">Tenant Subscription</option>
                <option value="premium_boost">Premium Boost</option>
                <option value="processing_fee">Processing Fee</option>
                <option value="agreement_fee">Agreement Fee</option>
                <option value="insurance_commission">Insurance Commission</option>
                <option value="service_fee">Service Fee</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="escrow">Escrow</option>
                <option value="revenue">Revenue</option>
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
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount || 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Held</p>
              <p className="text-2xl font-bold text-blue-600">{summary.byStatus?.held?.count || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Distributed</p>
              <p className="text-2xl font-bold text-green-600">{summary.byStatus?.distributed?.count || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {currentTransactions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Landlord/Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {transaction.transactionType ? getTypeLabel(transaction.transactionType) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 max-w-xs truncate">{transaction.description || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.propertyId ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">{transaction.propertyId.title}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.landlordId ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {transaction.landlordId.firstName} {transaction.landlordId.lastName || ''}
                            </p>
                          </div>
                        ) : transaction.tenantId ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {transaction.tenantId.firstName} {transaction.tenantId.lastName || ''}
                            </p>
                          </div>
                        ) : transaction.payerId ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">{transaction.payerId.firstName}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {transaction.amount != null && !isNaN(transaction.amount) 
                            ? formatCurrency(transaction.amount) 
                            : transaction.totalAmount != null && !isNaN(transaction.totalAmount)
                            ? formatCurrency(transaction.totalAmount)
                            : 'N/A'}
                        </p>
                        {transaction.landlordAmount != null && transaction.khayalamiAmount != null && 
                         !isNaN(transaction.landlordAmount) && !isNaN(transaction.khayalamiAmount) && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="text-green-600">L: {formatCurrency(transaction.landlordAmount)}</span>
                            {' • '}
                            <span className="text-purple-600">K: {formatCurrency(transaction.khayalamiAmount)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.source === 'escrow' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {transaction.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200/60 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
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

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-medium text-gray-900">{selectedTransaction._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium text-gray-900">{getTypeLabel(selectedTransaction.transactionType)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Source</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedTransaction.source === 'escrow' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {selectedTransaction.source}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-lg text-gray-900">
                        {selectedTransaction.amount != null && !isNaN(selectedTransaction.amount) 
                          ? formatCurrency(selectedTransaction.amount) 
                          : selectedTransaction.totalAmount != null && !isNaN(selectedTransaction.totalAmount)
                          ? formatCurrency(selectedTransaction.totalAmount)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="font-medium text-gray-900">{selectedTransaction.description}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Breakdown */}
                {selectedTransaction.landlordAmount && selectedTransaction.khayalamiAmount && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Amount Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="font-semibold text-gray-900">
                          {selectedTransaction.totalAmount != null && !isNaN(selectedTransaction.totalAmount)
                            ? formatCurrency(selectedTransaction.totalAmount)
                            : selectedTransaction.amount != null && !isNaN(selectedTransaction.amount)
                            ? formatCurrency(selectedTransaction.amount)
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Landlord Amount</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedTransaction.landlordAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Khayalami Amount</span>
                        <span className="font-semibold text-purple-600">{formatCurrency(selectedTransaction.khayalamiAmount)}</span>
                      </div>
                      {selectedTransaction.deductions && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Deductions</p>
                          {selectedTransaction.deductions.subscriptionFee && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subscription Fee</span>
                              <span className="text-gray-900">{formatCurrency(selectedTransaction.deductions.subscriptionFee)}</span>
                            </div>
                          )}
                          {selectedTransaction.deductions.processingFee && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Processing Fee</span>
                              <span className="text-gray-900">{formatCurrency(selectedTransaction.deductions.processingFee)}</span>
                            </div>
                          )}
                          {selectedTransaction.deductions.insurancePremium && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Insurance Premium</span>
                              <span className="text-gray-900">{formatCurrency(selectedTransaction.deductions.insurancePremium)}</span>
                            </div>
                          )}
                          {selectedTransaction.deductions.totalDeductions && (
                            <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-gray-200">
                              <span className="text-gray-900">Total Deductions</span>
                              <span className="text-gray-900">{formatCurrency(selectedTransaction.deductions.totalDeductions)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Property Info */}
                {selectedTransaction.propertyId && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Property</h4>
                    <p className="font-medium text-gray-900">{selectedTransaction.propertyId.title}</p>
                  </div>
                )}

                {/* Landlord/Tenant Info */}
                {(selectedTransaction.landlordId || selectedTransaction.tenantId || selectedTransaction.payerId) && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedTransaction.landlordId ? 'Landlord' : selectedTransaction.tenantId ? 'Tenant' : 'Payer'}
                    </h4>
                    {selectedTransaction.landlordId && (
                      <p className="font-medium text-gray-900">
                        {selectedTransaction.landlordId.firstName} {selectedTransaction.landlordId.lastName || ''}
                      </p>
                    )}
                    {selectedTransaction.tenantId && (
                      <p className="font-medium text-gray-900">
                        {selectedTransaction.tenantId.firstName} {selectedTransaction.tenantId.lastName || ''}
                      </p>
                    )}
                    {selectedTransaction.payerId && (
                      <p className="font-medium text-gray-900">{selectedTransaction.payerId.firstName}</p>
                    )}
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
