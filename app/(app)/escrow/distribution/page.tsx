// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useEscrowService, type EscrowTransaction } from '@/app/services/escrow/escrow.service';
import { useAuth } from '@/app/context/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Play,
  User,
  Building,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function DistributionManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<EscrowTransaction[]>([]);
  const [pendingSummary, setPendingSummary] = useState<{ count: number; totalAmount: number; totalLandlordAmount: number; totalKhayalamiAmount: number } | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const { 
    getPendingDistribution, 
    getDistributionSummary, 
    triggerManualDistribution,
    triggerEscrowDistribution 
  } = useEscrowService();
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
      
      const [pendingResponse, summaryResponse] = await Promise.all([
        getPendingDistribution(),
        getDistributionSummary()
      ]);
      
      if (pendingResponse?.success) {
        setPendingTransactions(pendingResponse.data.transactions);
        setPendingSummary(pendingResponse.data.summary);
        // Debug: Log the pending summary to verify values
        console.log('Pending Summary:', pendingResponse.data.summary);
      }
      
      if (summaryResponse?.success) {
        setSummary(summaryResponse.data);
        // Debug: Log the distribution summary to verify values
        console.log('Distribution Summary:', summaryResponse.data);
      }
    } catch (err) {
      console.error('Error fetching distribution data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch distribution data');
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (!confirm('Are you sure you want to distribute all pending transactions? This action cannot be undone.')) {
      return;
    }

    try {
      setDistributing(true);
      setError(null);

      // Try manual distribution endpoint first, fallback to escrow distribute
      let response = await triggerManualDistribution();
      
      if (!response) {
        response = await triggerEscrowDistribution();
      }
      
      if (response?.success) {
        setSuccessMessage(`Distribution completed successfully! ${formatCurrency(response.data.totalDistributed)} distributed to ${response.data.landlordPayouts} landlords.`);
        setShowDistributionModal(false);
        await fetchData();
        setTimeout(() => setSuccessMessage(null), 10000);
      } else {
        setError('Failed to trigger distribution');
      }
    } catch (err) {
      console.error('Error triggering distribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger distribution');
    } finally {
      setDistributing(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group transactions by landlord
  const transactionsByLandlord = pendingTransactions.reduce((acc, transaction) => {
    // Skip transactions without a landlord
    if (!transaction.landlordId || !transaction.landlordId._id) {
      return acc;
    }
    const landlordId = transaction.landlordId._id;
    if (!acc[landlordId]) {
      acc[landlordId] = {
        landlord: transaction.landlordId,
        transactions: [],
        totalAmount: 0
      };
    }
    acc[landlordId].transactions.push(transaction);
    acc[landlordId].totalAmount += transaction.landlordAmount;
    return acc;
  }, {} as Record<string, { landlord: any; transactions: EscrowTransaction[]; totalAmount: number }>);

  // Calculate totals from pending transactions
  const calculatedTotalPending = pendingTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const calculatedLandlordPayouts = pendingTransactions.reduce((sum, t) => sum + (t.landlordAmount || 0), 0);
  const calculatedKhayalamiPayouts = pendingTransactions.reduce((sum, t) => sum + (t.khayalamiAmount || 0), 0);
  
  // Use pending summary if available, otherwise calculate from transactions
  const totalPending = pendingSummary?.totalAmount ?? calculatedTotalPending;
  
  // For pending payouts, use pending summary if available, otherwise calculate
  const pendingLandlordPayouts = (pendingSummary?.totalLandlordAmount !== undefined && pendingSummary.totalLandlordAmount > 0) 
    ? pendingSummary.totalLandlordAmount 
    : calculatedLandlordPayouts;
  const pendingKhayalamiPayouts = (pendingSummary?.totalKhayalamiAmount !== undefined && pendingSummary.totalKhayalamiAmount > 0)
    ? pendingSummary.totalKhayalamiAmount
    : calculatedKhayalamiPayouts;
  
  // Use total historical payouts from account summary if available
  const totalLandlordPayouts = summary?.account?.totalLandlordPayouts ?? pendingLandlordPayouts;
  const totalKhayalamiPayouts = summary?.account?.totalKhayalamiPayouts ?? pendingKhayalamiPayouts;

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
              {authLoading ? 'Authentication is still loading. Please wait.' : 'Loading Distribution Data'}
            </h3>
            <p className="text-gray-500 text-sm">
              {authLoading ? 'Please wait while we verify your authentication...' : 'Please wait while we fetch distribution data...'}
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Distribution Management</h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1">Manage and trigger escrow distributions</p>
            </div>
          </div>
          <button
            onClick={() => setShowDistributionModal(true)}
            disabled={pendingTransactions.length === 0 || distributing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distributing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Distributing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Distribute Now
              </>
            )}
          </button>
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
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-500 mt-2">{pendingTransactions.length} transactions</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Landlord Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLandlordPayouts)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {summary?.account?.totalLandlordPayouts ? 'Total distributed' : `To ${Object.keys(transactionsByLandlord).length} landlords`}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Khayalami Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalKhayalamiPayouts)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {summary?.account?.totalKhayalamiPayouts ? 'Total distributed' : 'Commission'}
              </p>
            </div>
          </div>

          {/* Last Distribution Info */}
          {summary && summary.account && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {summary.account.lastDistributionDate 
                      ? formatDate(summary.account.lastDistributionDate) 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(summary.account.lastDistributionAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Method</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {summary.account.lastDistributionMethod || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Auto-Distribution</p>
                  <p className="font-medium text-gray-900">
                    {summary.account.autoDistributionEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Transactions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Transactions</h2>
              <p className="text-sm text-gray-500 mt-1">{pendingTransactions.length} transactions ready for distribution</p>
            </div>
            
            {pendingTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Transactions</h3>
                <p className="text-gray-500">All transactions have been distributed</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Landlord</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Landlord Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khayalami Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTransactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {transaction.propertyId?.title || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.propertyId?.address?.street || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {transaction.tenantId?.firstName || ''} {transaction.tenantId?.lastName || ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.landlordId ? (
                            <>
                              <p className="text-sm text-gray-900">
                                {transaction.landlordId.firstName} {transaction.landlordId.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{transaction.landlordId.email}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No landlord</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.totalAmount)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-green-600">{formatCurrency(transaction.landlordAmount)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-purple-600">{formatCurrency(transaction.khayalamiAmount)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution Confirmation Modal */}
      {showDistributionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Distribution</h3>
                <button
                  onClick={() => !distributing && setShowDistributionModal(false)}
                  disabled={distributing}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    You are about to distribute <strong>{formatCurrency(totalPending)}</strong> to <strong>{Object.keys(transactionsByLandlord).length} landlords</strong> and Khayalami.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(totalPending)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Landlord Payouts:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalLandlordPayouts)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Khayalami Payouts:</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(totalKhayalamiPayouts)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-gray-900">{pendingTransactions.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => !distributing && setShowDistributionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={distributing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDistribute}
                    disabled={distributing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {distributing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Distributing...
                      </>
                    ) : (
                      'Confirm Distribution'
                    )}
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

