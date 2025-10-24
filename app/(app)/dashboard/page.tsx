// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useDashboardService, type DashboardMetrics, type ReportResponse } from '../../services/dashboard/dashboard.service';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  FileText, 
  CreditCard, 
  Settings, 
  Link,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  const { getDashboardMetrics } = useDashboardService();
  const { getAdminReport } = useDashboardService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardMetrics();
        if (response?.success) {
          setDashboardData(response.data);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Error loading dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getDashboardMetrics, authLoading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Export dashboard report to XLSX using unified reports endpoint
  const handleExportReportXlsx = async () => {
    try {
      setExportLoading(true);
      const report = await getAdminReport();
      if (!report?.success) return;

      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

      // Meta sheet
      const metaRows: Array<Record<string, string>> = [];
      const meta = report.meta || {} as ReportResponse['meta'];
      if (meta.section) metaRows.push({ Key: 'Section', Value: meta.section });
      if (meta.groupBy) metaRows.push({ Key: 'Group By', Value: meta.groupBy });
      if (meta.range?.startDate) metaRows.push({ Key: 'Start Date', Value: meta.range.startDate });
      if (meta.range?.endDate) metaRows.push({ Key: 'End Date', Value: meta.range.endDate });
      if (meta.generatedAt) metaRows.push({ Key: 'Generated At', Value: meta.generatedAt });
      const metaSheet = XLSX.utils.json_to_sheet(metaRows.length ? metaRows : [{ Key: 'Info', Value: 'No meta' }]);
      metaSheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, metaSheet, 'Meta');

      // KPIs sheet
      const kpisEntries = Object.entries(report.kpis || {});
      const kpisRows = kpisEntries.length ? kpisEntries.map(([k, v]) => ({ KPI: k, Value: String(v ?? '') })) : [{ KPI: 'Info', Value: 'No KPIs' }];
      const kpisSheet = XLSX.utils.json_to_sheet(kpisRows);
      kpisSheet['!cols'] = [{ wch: 24 }, { wch: 16 }];
      kpisSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(1, kpisRows.length), c: 1 } }) };
      XLSX.utils.book_append_sheet(workbook, kpisSheet, 'KPIs');

      // Series sheet
      const seriesArray = (report.series || []).flatMap((s: any) => {
        const key = s?.key ?? 'series';
        const data = Array.isArray(s?.data) ? s.data : [];
        return data.map((row: any) => ({ Key: key, Period: row.period ?? '', Value: row.value ?? '', Count: row.count ?? '' }));
      });
      const seriesRows = seriesArray.length ? seriesArray : [{ Key: 'Info', Period: '', Value: 'No series', Count: '' }];
      const seriesSheet = XLSX.utils.json_to_sheet(seriesRows);
      seriesSheet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
      seriesSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(1, seriesRows.length), c: 3 } }) };
      XLSX.utils.book_append_sheet(workbook, seriesSheet, 'Series');

      // Tables sheets
      const tables = report.tables || {};
      const tableNames = Object.keys(tables);
      if (tableNames.length === 0) {
        const emptyTablesSheet = XLSX.utils.json_to_sheet([{ Info: 'No tables' }]);
        XLSX.utils.book_append_sheet(workbook, emptyTablesSheet, 'Tables');
      } else {
        tableNames.forEach((name) => {
          let rows: Array<Record<string, any>> = tables[name] && tables[name].length ? tables[name] : [{ Info: 'No data' }];

          // Known table shaping for better readability
          if (name === 'usersRecent') {
            rows = (tables[name] || []).map((u: any) => ({
              Name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
              Email: u.email ?? '',
              Role: u.role ?? '',
              CreatedAt: u.createdAt ?? '',
              UserId: u._id ?? '',
            }));
          }
          if (name === 'paymentsRecent') {
            rows = (tables[name] || []).map((p: any) => ({
              Amount: p.amount ?? 0,
              Method: p.paymentMethod ?? '',
              Status: p.status ?? '',
              Tenant: `${p.tenantId?.firstName ?? ''} ${p.tenantId?.lastName ?? ''}`.trim(),
              Landlord: `${p.landlordId?.firstName ?? ''} ${p.landlordId?.lastName ?? ''}`.trim(),
              CreatedAt: p.createdAt ?? '',
              PaymentId: p._id ?? '',
            }));
          }

          // Sheet names max length 31 in Excel
          const safeName = (name || 'Table').slice(0, 31);
          const sheet = XLSX.utils.json_to_sheet(rows);
          // Column widths & filters
          const colCount = Object.keys(rows[0] || {}).length;
          sheet['!cols'] = Array.from({ length: colCount }).map(() => ({ wch: 18 }));
          sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(1, rows.length), c: Math.max(0, colCount - 1) } }) };
          XLSX.utils.book_append_sheet(workbook, sheet, `Tbl - ${safeName}`.slice(0, 31));
        });
      }

      XLSX.writeFile(workbook, `dashboard_report_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) {
      console.error('Failed to export dashboard report XLSX', e);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Loading Dashboard</h3>
            <p className="text-gray-500 text-sm">Please wait while we fetch your dashboard data...</p>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Error Loading Dashboard</h3>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* iOS-style header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={handleExportReportXlsx}
            disabled={exportLoading}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm ${exportLoading ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}`}
          >
            {exportLoading ? (
              <span className="inline-flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white mr-2"></span>
                Exporting...
              </span>
            ) : (
              <span className="inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Export Report
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900">{dashboardData?.overview.totalUsers || 0}</p>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">Platform Users</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-900">{formatPrice(dashboardData?.financial.totalRevenue || 0)}</p>
                  <div className="flex items-center mt-2">
                    <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Monthly: {formatPrice(dashboardData?.financial.monthlyRevenue || 0)}</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Active Rentals */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Active Rentals</p>
                  <p className="text-3xl font-bold text-purple-900">{dashboardData?.overview.totalRentals || 0}</p>
                  <div className="flex items-center mt-2">
                    <Building className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">Properties Rented</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <Building className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Services</p>
                  <p className="text-3xl font-bold text-orange-900">{dashboardData?.overview.totalServices || 0}</p>
                  <div className="flex items-center mt-2">
                    <Settings className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">Maintenance Requests</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <Settings className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                  <p className="text-sm text-gray-600">Monthly revenue and transaction data</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData?.charts?.revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [formatPrice(value), name]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
                  <p className="text-sm text-gray-600">New users by month</p>
                </div>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.charts?.userGrowthChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="landlords" fill="#3b82f6" name="Landlords" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tenants" fill="#8b5cf6" name="Tenants" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Methods & Service Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                  <p className="text-sm text-gray-600">Distribution of payment types</p>
                </div>
                <CreditCard className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData?.charts?.paymentMethodChart || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ method, count }) => `${method}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {dashboardData?.charts?.paymentMethodChart?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name, props) => [
                        `${value} payments (${formatPrice(props.payload.totalAmount)})`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Types */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Service Types</h3>
                  <p className="text-sm text-gray-600">Maintenance request distribution</p>
                </div>
                <Settings className="w-6 h-6 text-orange-500" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.charts?.serviceTypeChart || []} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      type="number" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      dataKey="serviceType" 
                      type="category"
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name, props) => [
                        `${value} requests`,
                        name
                      ]}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Agreements Status */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Agreements</h3>
                  <p className="text-sm text-blue-600">Contract status</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-blue-700">Signed</span>
                  </div>
                  <span className="font-bold text-blue-900 bg-blue-200 px-2 py-1 rounded-full">{dashboardData?.analytics.agreementStats.byStatus.signed || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-blue-700">Pending</span>
                  </div>
                  <span className="font-bold text-blue-900 bg-blue-200 px-2 py-1 rounded-full">{dashboardData?.analytics.agreementStats.byStatus.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">Active</span>
                  </div>
                  <span className="font-bold text-blue-900 bg-blue-200 px-2 py-1 rounded-full">{dashboardData?.analytics.agreementStats.byStatus.active || 0}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Payments</h3>
                  <p className="text-sm text-green-600">Transaction status</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700">Verified</span>
                  </div>
                  <span className="font-bold text-green-900 bg-green-200 px-2 py-1 rounded-full">{dashboardData?.analytics.paymentStats.byStatus.verified?.count || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm text-green-700">Rejected</span>
                  </div>
                  <span className="font-bold text-green-900 bg-green-200 px-2 py-1 rounded-full">{dashboardData?.analytics.paymentStats.byStatus.rejected?.count || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-green-700">Pending</span>
                  </div>
                  <span className="font-bold text-green-900 bg-green-200 px-2 py-1 rounded-full">{dashboardData?.analytics.paymentStats.byStatus.pending?.count || 0}</span>
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Services</h3>
                  <p className="text-sm text-orange-600">Maintenance status</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-orange-700">Completed</span>
                  </div>
                  <span className="font-bold text-orange-900 bg-orange-200 px-2 py-1 rounded-full">{dashboardData?.analytics.serviceStats.byStatus.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm text-orange-700">Rejected</span>
                  </div>
                  <span className="font-bold text-orange-900 bg-orange-200 px-2 py-1 rounded-full">{dashboardData?.analytics.serviceStats.byStatus.rejected || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm text-orange-700">Cancelled</span>
                  </div>
                  <span className="font-bold text-orange-900 bg-orange-200 px-2 py-1 rounded-full">{dashboardData?.analytics.serviceStats.byStatus.cancelled || 0}</span>
                </div>
              </div>
            </div>

            {/* Platform Activity */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Platform</h3>
                  <p className="text-sm text-purple-600">Activity metrics</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-purple-700">Active Chats</span>
                  </div>
                  <span className="font-bold text-purple-900 bg-purple-200 px-2 py-1 rounded-full">{dashboardData?.overview.totalChats || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Link className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-purple-700">Connections</span>
                  </div>
                  <span className="font-bold text-purple-900 bg-purple-200 px-2 py-1 rounded-full">{dashboardData?.overview.totalConnections || 0}</span>
                </div>
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm text-purple-700">Properties</span>
                  </div>
                  <span className="font-bold text-purple-900 bg-purple-200 px-2 py-1 rounded-full">{dashboardData?.overview.totalProperties || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                  <p className="text-sm text-gray-600">Latest platform registrations</p>
                </div>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                {dashboardData?.recentActivity.recentUsers.slice(0, 4).map((user) => (
                  <div key={user._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'landlord' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                  <p className="text-sm text-gray-600">Latest transaction activity</p>
                </div>
                <CreditCard className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-4">
                {dashboardData?.recentActivity.recentPayments.slice(0, 4).map((payment) => (
                  <div key={payment._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{formatPrice(payment.amount)}</p>
                      <p className="text-sm text-gray-500">{payment.tenantId.firstName} {payment.tenantId.lastName}</p>
                      <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{payment.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 