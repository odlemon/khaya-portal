// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, UserIcon, HomeIcon, CalendarIcon, MagnifyingGlassIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useMaintenanceService, type MaintenanceRequest } from '../../services/maintenance/maintenance.service';
import { useVendorsService, type ServiceProvider } from '../../services/vendors/vendors.service';
import { useAuth } from '../../context/AuthContext';

export default function MaintenanceRequestsPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [newETA, setNewETA] = useState('');
  const [etaMessage, setEtaMessage] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [etaLoading, setEtaLoading] = useState(false);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { getAllMaintenanceRequests, assignVendor, updateVendorETA, markVendorArrived, updateRequestStatus } = useMaintenanceService();
  const { getServiceProviders } = useVendorsService();
  const { loading: authLoading } = useAuth();

  // Fetch requests and vendors from API
  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch maintenance requests
        const requestsResponse = await getAllMaintenanceRequests();
        if (requestsResponse?.success) {
          setRequests(requestsResponse.data);
          setFilteredRequests(requestsResponse.data);
        } else {
          setError('Failed to fetch maintenance requests');
        }

        // Fetch vendors
        const vendorsResponse = await getServiceProviders();
        if (vendorsResponse?.success) {
          setVendors(vendorsResponse.data);
        }
      } catch (err: any) {
        setError('Error loading data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getAllMaintenanceRequests, getServiceProviders, authLoading]);

  // Filter and search logic
  useEffect(() => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.propertyId.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.landlordId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.landlordId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenantId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.tenantId.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [requests, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const handleAssignVendor = async () => {
    if (!selectedRequest || !selectedVendor || !estimatedArrival) {
      setError('Please select a vendor and set estimated arrival time');
      return;
    }

    try {
      setAssignLoading(true);
      setError(null);
      await assignVendor(selectedRequest._id, { vendorId: selectedVendor, estimatedArrival });
      // Refresh requests
      const response = await getAllMaintenanceRequests();
      if (response?.success) {
        setRequests(response.data);
        setFilteredRequests(response.data);
        // Update selected request if it's the same one
        const updatedRequest = response.data.find(r => r._id === selectedRequest._id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
      setShowAssignModal(false);
      setSelectedVendor('');
      setEstimatedArrival('');
    } catch (err: any) {
      setError(err.message || 'Failed to assign vendor');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUpdateETA = async () => {
    if (!selectedRequest || !newETA) {
      setError('Please set a new estimated arrival time');
      return;
    }

    try {
      setEtaLoading(true);
      setError(null);
      await updateVendorETA(selectedRequest._id, {
        estimatedArrival: newETA,
        message: etaMessage || 'ETA updated by admin'
      });
      // Refresh requests
      const response = await getAllMaintenanceRequests();
      if (response?.success) {
        setRequests(response.data);
        setFilteredRequests(response.data);
        // Update selected request if it's the same one
        const updatedRequest = response.data.find(r => r._id === selectedRequest._id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
      setNewETA('');
      setEtaMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to update ETA');
    } finally {
      setEtaLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!selectedRequest) return;

    try {
      setArrivalLoading(true);
      setError(null);
      await markVendorArrived(selectedRequest._id, {
        message: 'Vendor has arrived at the property'
      });
      // Refresh requests
      const response = await getAllMaintenanceRequests();
      if (response?.success) {
        setRequests(response.data);
        setFilteredRequests(response.data);
        // Update selected request if it's the same one
        const updatedRequest = response.data.find(r => r._id === selectedRequest._id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark vendor as arrived');
    } finally {
      setArrivalLoading(false);
    }
  };

  const handleOpenDetailModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      awaiting_vendor: 'bg-orange-100 text-orange-800',
      vendor_assigned: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: { [key: string]: string } = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[urgency] || 'text-gray-600';
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === 'urgent') return <ExclamationTriangleIcon className="h-4 w-4" />;
    return <ClockIcon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Maintenance Requests</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-full sm:w-auto flex items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-80 lg:w-96">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
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

          {currentRequests.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No requests found' : 'No requests yet'}
                </h3>
                <p className="text-gray-500 text-base sm:text-lg">
                  {searchTerm ? 'Try adjusting your search terms' : 'Maintenance requests will appear here once created'}
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
                    <div className="col-span-3">Request</div>
                    <div className="col-span-2">Property</div>
                    <div className="col-span-2">Tenant</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Urgency</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200/50">
                  {currentRequests.map((request) => (
                    <div 
                      key={request._id} 
                      className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetailModal(request)}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Request Info */}
                        <div className="col-span-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {request.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {request.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {request.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Property */}
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.propertyId.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {request.propertyId.address.street}, {request.propertyId.address.city}
                          </p>
                        </div>

                        {/* Tenant */}
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.tenantId.firstName} {request.tenantId.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {request.tenantId.email}
                          </p>
                        </div>

                        {/* Type */}
                        <div className="col-span-1">
                          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {request.issueType}
                          </span>
                        </div>

                        {/* Urgency */}
                        <div className="col-span-1">
                          <div className={`flex items-center gap-1 ${getUrgencyColor(request.urgency)}`}>
                            {getUrgencyIcon(request.urgency)}
                            <span className="text-xs font-medium capitalize">{request.urgency}</span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="col-span-1">
                          <p className="text-sm text-gray-900">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            {request.status === 'awaiting_vendor' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRequest(request);
                                  setShowAssignModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Assign Vendor"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(request);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="View Details"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
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

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedRequest.title}</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">{selectedRequest.description}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
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
                {/* Request Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedRequest.title.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Request Details</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Maintenance request information</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ')}
                      </span>
                      <div className={`flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getUrgencyColor(selectedRequest.urgency)} bg-opacity-10`}>
                        {getUrgencyIcon(selectedRequest.urgency)}
                        <span className="capitalize">{selectedRequest.urgency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Type</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 capitalize">{selectedRequest.issueType}</p>
                      <p className="text-xs text-gray-500">issue type</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Created</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                      <p className="text-xs text-gray-500">request date</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <HomeIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700">Property</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedRequest.propertyId.title}</p>
                      <p className="text-xs text-gray-500">rental property</p>
                    </div>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Tenant */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {selectedRequest.tenantId.firstName[0]}{selectedRequest.tenantId.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Tenant</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Request submitter</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedRequest.tenantId.firstName} {selectedRequest.tenantId.lastName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedRequest.tenantId.email}</p>
                    </div>
                  </div>

                  {/* Landlord */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {selectedRequest.landlordId.firstName[0]}{selectedRequest.landlordId.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Landlord</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Property owner</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedRequest.landlordId.firstName} {selectedRequest.landlordId.lastName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedRequest.landlordId.email}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned Vendor */}
                {selectedRequest.assignedVendor && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Assigned Vendor</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Service provider</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Name:</span>
                        <span className="font-medium text-sm">{selectedRequest.assignedVendor.vendorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Company:</span>
                        <span className="font-medium text-sm">{selectedRequest.assignedVendor.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Phone:</span>
                        <span className="font-medium text-sm">{selectedRequest.assignedVendor.phoneNumber}</span>
                      </div>
                      {selectedRequest.estimatedArrival && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">ETA:</span>
                          <span className="font-medium text-sm">{formatDateTime(selectedRequest.estimatedArrival)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor Updates */}
                {selectedRequest.vendorUpdates && selectedRequest.vendorUpdates.length > 0 && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Updates</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Vendor communication</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {selectedRequest.vendorUpdates.map((update, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-900 capitalize">{update.type.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-500">{formatDateTime(update.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{update.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">From: {update.from}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vendor Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Assign Vendor</h3>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Select a vendor for: <strong>{selectedRequest.title}</strong></p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Vendor Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Vendor</label>
                  <div className="relative">
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Choose a vendor...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name} - {vendor.company} • {vendor.serviceTypes?.join(', ')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Selected Vendor Preview */}
                  {selectedVendor && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      {(() => {
                        const vendor = vendors.find(v => v._id === selectedVendor);
                        return vendor ? (
                          <div>
                            <div className="font-medium text-blue-900">{vendor.name} - {vendor.company}</div>
                            <div className="text-sm text-blue-700 mt-1">{vendor.phoneNumber}</div>
                            <div className="text-xs text-blue-600 mt-1">{vendor.serviceTypes?.join(', ')}</div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Estimated Arrival */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Estimated Arrival</label>
                  <input
                    type="datetime-local"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedVendor('');
                    setEstimatedArrival('');
                  }}
                  className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignVendor}
                  disabled={!selectedVendor || !estimatedArrival || assignLoading}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {assignLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </div>
                  ) : (
                    'Assign Vendor'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{selectedRequest.title}</h3>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Request Details & Vendor Management</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Request Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Request Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Urgency</label>
                      <p className={`text-sm font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                        {selectedRequest.urgency.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Issue Type</label>
                      <p className="text-sm text-gray-900">{selectedRequest.issueType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedRequest.createdAt || new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRequest.description}</p>
                  </div>
                </div>

                {/* Property & Tenant Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Property & Tenant</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Property</label>
                      <p className="text-sm text-gray-900">{selectedRequest.propertyId.title}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.propertyId.address.street}, {selectedRequest.propertyId.address.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Landlord</label>
                      <p className="text-sm text-gray-900">{selectedRequest.landlordId.firstName} {selectedRequest.landlordId.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.landlordId.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tenant</label>
                      <p className="text-sm text-gray-900">{selectedRequest.tenantId.firstName} {selectedRequest.tenantId.lastName}</p>
                      <p className="text-xs text-gray-500">{selectedRequest.tenantId.email}</p>
                    </div>
                  </div>
                </div>

                {/* Vendor Assignment */}
                {selectedRequest.assignedVendor ? (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Assigned Vendor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Vendor</label>
                        <p className="text-sm text-gray-900">{selectedRequest.assignedVendor.vendorName}</p>
                        <p className="text-xs text-gray-500">{selectedRequest.assignedVendor.company}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact</label>
                        <p className="text-sm text-gray-900">{selectedRequest.assignedVendor.phoneNumber}</p>
                        {selectedRequest.assignedVendor.email && (
                          <p className="text-xs text-gray-500">{selectedRequest.assignedVendor.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estimated Arrival</label>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.estimatedArrival ? formatDateTime(selectedRequest.estimatedArrival) : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Actual Arrival</label>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.actualArrival ? formatDateTime(selectedRequest.actualArrival) : 'Not arrived yet'}
                        </p>
                      </div>
                    </div>

                    {/* Vendor Management Actions */}
                    <div className="mt-6 space-y-4">
                      {/* Update ETA Section - Only show for active requests */}
                      {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h5 className="text-sm font-semibold text-blue-900">Update Estimated Arrival</h5>
                          </div>
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <input
                                type="datetime-local"
                                value={newETA}
                                onChange={(e) => setNewETA(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                min={new Date().toISOString().slice(0, 16)}
                                placeholder="Select new arrival time"
                              />
                              <button
                                onClick={handleUpdateETA}
                                disabled={!newETA || etaLoading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200"
                              >
                                {etaLoading ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Updating...
                                  </div>
                                ) : (
                                  'Update ETA'
                                )}
                              </button>
                            </div>
                            <textarea
                              value={etaMessage}
                              onChange={(e) => setEtaMessage(e.target.value)}
                              placeholder="Add a message for the update (e.g., 'Traffic delay - running 2 hours late')..."
                              className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {/* Mark as Arrived Section - Only show for vendor_assigned status */}
                      {selectedRequest.status === 'vendor_assigned' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h5 className="text-sm font-semibold text-green-900">Vendor Arrival</h5>
                          </div>
                          <p className="text-sm text-green-700 mb-3">Mark the vendor as arrived when they reach the property</p>
                          <button
                            onClick={handleMarkArrived}
                            disabled={arrivalLoading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200"
                          >
                            {arrivalLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Marking...
                              </div>
                            ) : (
                              'Mark Vendor as Arrived'
                            )}
                          </button>
                        </div>
                      )}

                      {/* Completed Request Message */}
                      {selectedRequest.status === 'completed' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h5 className="text-sm font-semibold text-green-900">Request Completed</h5>
                          </div>
                          <p className="text-sm text-green-700">This maintenance request has been completed successfully.</p>
                        </div>
                      )}

                      {/* Cancelled Request Message */}
                      {selectedRequest.status === 'cancelled' && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <h5 className="text-sm font-semibold text-red-900">Request Cancelled</h5>
                          </div>
                          <p className="text-sm text-red-700">This maintenance request has been cancelled.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-900">No Vendor Assigned</h4>
                        <p className="text-sm text-yellow-700">This request is awaiting vendor assignment</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedRequest(selectedRequest);
                        setShowAssignModal(true);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-all duration-200"
                    >
                      Assign Vendor
                    </button>
                  </div>
                )}

                {/* Vendor Updates */}
                {selectedRequest.vendorUpdates && selectedRequest.vendorUpdates.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Vendor Updates</h4>
                    <div className="space-y-2">
                      {selectedRequest.vendorUpdates.map((update, index) => (
                        <div key={index} className="bg-white rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-900">{update.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {update.type.replace('_', ' ').toUpperCase()} • {formatDateTime(update.timestamp)}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 capitalize">{update.from}</span>
                          </div>
                        </div>
                      ))}
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
