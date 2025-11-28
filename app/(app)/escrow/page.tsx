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
  Settings,
  ArrowRight,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function EscrowPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const { getEscrowSummary } = useEscrowService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchSummary();
  }, [authLoading]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEscrowSummary();
      
      if (response?.success) {
        setSummary(response.data);
      } else {
        setError('Failed to fetch escrow summary');
      }
    } catch (err) {
      console.error('Error fetching escrow summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch escrow summary');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              {authLoading ? 'Authentication is still loading. Please wait.' : 'Loading Escrow Summary'}
            </h3>
            <p className="text-gray-500 text-sm">
              {authLoading ? 'Please wait while we verify your authentication...' : 'Please wait while we fetch escrow data...'}
            </p>
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
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Escrow</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchSummary}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const { account, totalHeld, pendingLandlordPayouts, pendingKhayalamiPayouts, transactionCounts } = summary;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Escrow Management</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Monitor and manage escrow funds and distributions</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/escrow/transactions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              View All Transactions
            </Link>
            <Link
              href="/escrow/distribution"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Distribution Management
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Held */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Held in Escrow</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalHeld)}</p>
              <p className="text-xs text-gray-500 mt-2">{transactionCounts.held} transactions</p>
            </div>

            {/* Pending Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Pending Distribution</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(pendingLandlordPayouts + pendingKhayalamiPayouts)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatCurrency(pendingLandlordPayouts)} to landlords
              </p>
            </div>

            {/* Total Distributed */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Distributed (All Time)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.totalDistributed)}</p>
              <p className="text-xs text-gray-500 mt-2">{account.distributedTransactions} transactions</p>
            </div>

            {/* Last Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Last Distribution</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(account.lastDistributionDate)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatCurrency(account.lastDistributionAmount)} • {account.lastDistributionMethod === 'scheduled' ? 'Scheduled' : 'Manual'}
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Escrow Account Summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Escrow Account Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Held</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.totalHeld)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Pending Landlord Payouts</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(pendingLandlordPayouts)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Pending Khayalami Payouts</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(pendingKhayalamiPayouts)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Landlord Payouts (All Time)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.totalLandlordPayouts)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Khayalami Payouts (All Time)</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.totalKhayalamiPayouts)}</span>
                </div>
              </div>
            </div>

            {/* Transaction Counts & Settings */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Pending Transactions</span>
                  <span className="text-sm font-semibold text-yellow-600">{transactionCounts.pending}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Held Transactions</span>
                  <span className="text-sm font-semibold text-blue-600">{transactionCounts.held}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Distributed Transactions</span>
                  <span className="text-sm font-semibold text-green-600">{transactionCounts.distributed}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-Distribution</span>
                    <div className="flex items-center gap-2">
                      {account.autoDistributionEnabled ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {account.autoDistributionEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  {account.autoDistributionEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Distribution Day</span>
                      <span className="text-sm font-semibold text-gray-900">Day {account.distributionDay} of month</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/escrow/transactions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View All Transactions
              </Link>
              <Link
                href="/escrow/distribution"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Distribution
              </Link>
              <Link
                href="/payments/requests"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                View Payment Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
