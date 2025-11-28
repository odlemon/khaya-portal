// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { usePaymentsService, EarningsResponse, EarningsSummary, EarningsPayment } from '../../services/payments/payments.service';
import { DollarSign, TrendingUp, Users, CreditCard, Download, Filter, Search, ChevronDown, Calendar, User, Wifi, Banknote, Eye, X, Building } from 'lucide-react';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export default function EarningsPage() {
  const { getEarnings } = usePaymentsService();
  const [earningsData, setEarningsData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<EarningsPayment | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEarnings();
      if (data) {
        setEarningsData(data);
        setRetryCount(0); // Reset retry count on success
      } else {
        // If no data returned, it might be cached (304 response)
        console.log('No new data received, might be cached');
        if (retryCount < 2) {
          // Retry a few times for 304 responses
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchEarnings(), 1000);
          return;
        }
        setError('Unable to load earnings data. This might be due to server configuration or network issues. Please try refreshing the page.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('An error occurred while fetching earnings data');
      }
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [getEarnings]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodDisplay = (method: string) => {
    return method === 'in_app' ? 'Online' : 'Cash';
  };

  const getPaymentMethodIcon = (method: string) => {
    return method === 'in_app' ? <Wifi className="w-4 h-4" /> : <Banknote className="w-4 h-4" />;
  };

  const getPaymentMethodColor = (method: string) => {
    return method === 'in_app' ? 'text-blue-600' : 'text-green-600';
  };

  const handleExportXlsx = async () => {
    if (!earningsData) return;
    
    try {
      setExportLoading(true);
      
      // Prepare data for export
      const exportData = earningsData.data.payments.map((payment, index) => ({
        'S/N': index + 1,
        'Receipt Number': payment.receiptNumber,
        'Payment Type': payment.paymentType,
        'Amount': payment.totalAmount,
        'Payment Method': getPaymentMethodDisplay(payment.paymentMethod),
        'Status': payment.status,
        'Landlord': payment.landlordId ? `${payment.landlordId.firstName || ''} ${payment.landlordId.lastName || ''}`.trim() : 'N/A',
        'Landlord Email': payment.landlordId?.email || 'N/A',
        'Tenant': payment.tenantId ? `${payment.tenantId.firstName || ''} ${payment.tenantId.lastName || ''}`.trim() : 'N/A',
        'Tenant Email': payment.tenantId?.email || 'N/A',
        'Property': payment.propertyId.title,
        'Commission': payment.khayalamiCommission,
        'Commission %': payment.commissionPercentage,
        'Landlord Amount': payment.landlordAmount,
        'Payment Date': formatDate(payment.paymentDate),
        'Due Date': formatDate(payment.dueDate),
        'Verified At': payment.verifiedAt ? formatDate(payment.verifiedAt) : 'N/A',
        'Notes': payment.notes || 'N/A'
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // S/N
        { wch: 20 },  // Receipt Number
        { wch: 15 },  // Payment Type
        { wch: 12 },  // Amount
        { wch: 15 },  // Payment Method
        { wch: 12 },  // Status
        { wch: 20 },  // Landlord
        { wch: 25 },  // Landlord Email
        { wch: 20 },  // Tenant
        { wch: 25 },  // Tenant Email
        { wch: 20 },  // Property
        { wch: 12 },  // Commission
        { wch: 12 },  // Commission %
        { wch: 15 },  // Landlord Amount
        { wch: 20 },  // Payment Date
        { wch: 20 },  // Due Date
        { wch: 20 },  // Verified At
        { wch: 30 }   // Notes
      ];
      ws['!cols'] = colWidths;

      // Add summary sheet
      const summaryData = [
        ['Earnings Summary Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Total Payments:', earningsData.data.summary.totalPayments],
        ['Total Amount:', earningsData.data.summary.totalAmount],
        ['Total Commission:', earningsData.data.summary.totalCommission],
        ['Total Landlord Amount:', earningsData.data.summary.totalLandlordAmount],
        ['Average Commission:', earningsData.data.summary.averageCommission],
        ['Commission Rate:', `${earningsData.data.summary.commissionRate}%`]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
      
      // Add sheets to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      XLSX.utils.book_append_sheet(wb, ws, 'Payments');
      
      // Generate filename
      const filename = `earnings-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredPayments = earningsData?.data.payments.filter(payment => {
    const matchesSearch = 
      (payment.landlordId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payment.landlordId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payment.tenantId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payment.tenantId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payment.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Loading Earnings</h3>
            <p className="text-gray-500 text-sm">Please wait while we fetch your earnings data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Error Loading Earnings</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={fetchEarnings}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>

    );
  }

  const summary: EarningsSummary = earningsData?.data.summary || {
    totalPayments: 0,
    totalAmount: 0,
    totalCommission: 0,
    totalLandlordAmount: 0,
    averageCommission: 0,
    commissionRate: 0,
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        {/* iOS-style Header */}
        <div className="px-6 py-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Earnings</h1>
              <p className="text-gray-500 mt-1">Commission tracking and payment analytics</p>
            </div>
            <button
              onClick={handleExportXlsx}
              disabled={exportLoading}
              className={`inline-flex items-center justify-center px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md ${
                exportLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="space-y-8">
            {/* iOS-style Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Commission */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.totalCommission)}</p>
                    <p className="text-sm text-gray-500">Total Commission</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">{summary.commissionRate}% rate</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>

              {/* Total Payments */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
                    <p className="text-sm text-gray-500">Total Payments</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">Transactions</span>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.totalAmount)}</p>
                    <p className="text-sm text-gray-500">Total Amount</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-600">All payments</span>
                  <DollarSign className="w-4 h-4 text-purple-500" />
                </div>
              </div>

              {/* Average Commission */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.averageCommission)}</p>
                    <p className="text-sm text-gray-500">Avg Commission</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-600">Per transaction</span>
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
              </div>
            </div>

            {/* iOS-style Search and Filters */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search payments, names, or receipt numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900 transition-all duration-200 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                  <button className="inline-flex items-center px-5 py-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200 bg-gray-50">
                    <Filter className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-gray-700 font-medium">Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* iOS-style Payments List */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
                    <p className="text-gray-500 mt-1">{filteredPayments.length} payments found</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <div key={payment._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{payment.receiptNumber}</span>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {payment.landlordId ? `${payment.landlordId.firstName || ''} ${payment.landlordId.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">Landlord</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {payment.tenantId ? `${payment.tenantId.firstName || ''} ${payment.tenantId.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">Tenant</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-gray-900 mb-3">{formatPrice(payment.totalAmount)}</div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                          payment.paymentMethod === 'in_app' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          {getPaymentMethodDisplay(payment.paymentMethod)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{formatPrice(payment.khayalamiCommission)}</div>
                            <div className="text-xs text-gray-500">Commission</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{formatPrice(payment.landlordAmount)}</div>
                            <div className="text-xs text-gray-500">Landlord</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDialog(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Dialog */}
      {showDialog && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => setShowDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Receipt Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{selectedPayment.receiptNumber}</span>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedPayment.status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : selectedPayment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{formatPrice(selectedPayment.totalAmount)}</div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    selectedPayment.paymentMethod === 'in_app' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                    {getPaymentMethodDisplay(selectedPayment.paymentMethod)}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{formatPrice(selectedPayment.khayalamiCommission)}</div>
                    <div className="text-sm text-green-700 font-medium">Khayalami Commission</div>
                    <div className="text-xs text-gray-500">{selectedPayment.commissionPercentage}%</div>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{formatPrice(selectedPayment.landlordAmount)}</div>
                    <div className="text-sm text-blue-700 font-medium">Landlord Amount</div>
                  </div>
                </div>

                {/* People Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Landlord</p>
                        <p className="text-sm text-gray-500">{selectedPayment.landlordId?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPayment.landlordId ? `${selectedPayment.landlordId.firstName || ''} ${selectedPayment.landlordId.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Tenant</p>
                        <p className="text-sm text-gray-500">{selectedPayment.tenantId?.email || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPayment.tenantId ? `${selectedPayment.tenantId.firstName || ''} ${selectedPayment.tenantId.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Property Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Property</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedPayment.propertyId.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedPayment.propertyId.address.street}, {selectedPayment.propertyId.address.city}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Payment Date</p>
                    <p className="text-sm text-gray-600">{formatDate(selectedPayment.paymentDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Due Date</p>
                    <p className="text-sm text-gray-600">{formatDate(selectedPayment.dueDate)}</p>
                  </div>
                </div>

                {/* Additional Info */}
                {selectedPayment.notes && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
