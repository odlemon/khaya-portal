// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useUsersService, type User } from '../../services/users/users.service';
import { useAuth } from '../../context/AuthContext';

export const dynamic = 'force-dynamic';

export default function TenantsPage() {
  const [allTenants, setAllTenants] = useState<User[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalTenants, setTotalTenants] = useState(0);
  
  const { getTenants } = useUsersService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await getTenants(1, 100); // Fetch all tenants for local search
        if (response?.success) {
          setAllTenants(response.data.users);
          setTotalTenants(response.data.pagination.total);
        } else {
          setError('Failed to fetch tenants');
        }
      } catch (err) {
        setError('Error loading tenants');
        console.error('Error fetching tenants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [getTenants, authLoading]);

  // Filter tenants based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTenants(allTenants);
    } else {
      const filtered = allTenants.filter(tenant =>
        (tenant.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTenants(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, allTenants]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTenants = filteredTenants.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        <div className="px-6 py-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
        </div>
        <div className="flex-1 px-6 pb-6">
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* iOS-style header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
            <p className="text-sm text-gray-500 mt-1">{totalTenants} tenants</p>
          </div>
          <div className="w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {currentTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M17 20a4 4 0 00-3-3.87M9 20a4 4 0 013-3.87M12 3v17m0 0a4 4 0 01-4-4V7a4 4 0 014-4zm0 0a4 4 0 014 4v9a4 4 0 01-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No tenants found' : 'No tenants yet'}
              </h3>
              <p className="text-gray-500 text-center max-w-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Tenants will appear here when they register'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {currentTenants.map((tenant) => (
                        <tr key={tenant._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {tenant.firstName[0]}{tenant.lastName[0]}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {tenant.firstName} {tenant.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tenant.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tenant.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                tenant.isActive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {tenant.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {tenant.isVerified && (
                                <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(tenant.createdAt)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTenants.length)} of {filteredTenants.length} tenants
                    {searchTerm && ` (filtered from ${totalTenants} total)`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
