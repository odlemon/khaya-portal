// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon, XCircleIcon, StarIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useVendorsService, type ServiceProvider, type ServiceProviderFilters } from '../../services/vendors/vendors.service';
import { useAuth } from '../../context/AuthContext';

export default function VendorsPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceProviderFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<ServiceProvider | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    company: '',
    phoneNumber: '',
    email: '',
    serviceTypes: [] as string[],
    location: {
      city: '',
      area: '',
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    },
    businessLicense: '',
    insuranceNumber: '',
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: [] as string[]
    }
  });
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    phoneNumber: '',
    email: '',
    serviceTypes: [] as string[],
    location: {
      city: '',
      area: '',
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    },
    businessLicense: '',
    insuranceNumber: '',
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: [] as string[]
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { getServiceProviders, createServiceProvider, updateServiceProvider, deleteServiceProvider, verifyServiceProvider } = useVendorsService();
  const { loading: authLoading } = useAuth();

  // Fetch providers from API
  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getServiceProviders(filters);
        if (response?.success) {
          setProviders(response.data);
          setFilteredProviders(response.data);
        } else {
          setError('Failed to fetch service providers');
        }
      } catch (err: any) {
        setError('Error loading service providers');
        console.error('Error fetching providers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [filters, getServiceProviders, authLoading]);

  // Set filtered providers to all providers (no filtering)
  useEffect(() => {
    setFilteredProviders(providers);
    setCurrentPage(1);
  }, [providers]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProviders = filteredProviders.slice(startIndex, endIndex);

  const handleDeleteProvider = (provider: ServiceProvider) => {
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return;

    try {
      setActionLoading(providerToDelete._id);
      await deleteServiceProvider(providerToDelete._id);
      // Refresh providers
      const response = await getServiceProviders(filters);
      if (response?.success) {
        setProviders(response.data);
        setFilteredProviders(response.data);
      }
      setShowDeleteDialog(false);
      setProviderToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete service provider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyProvider = async (id: string, isVerified: boolean) => {
    try {
      setActionLoading(id);
      await verifyServiceProvider(id, { 
        isVerified, 
        verificationNotes: isVerified ? 'Verified by admin' : 'Rejected by admin' 
      });
      // Refresh providers
      const response = await getServiceProviders(filters);
      if (response?.success) {
        setProviders(response.data);
        setFilteredProviders(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProvider = async () => {
    try {
      setLoading(true);
      setError(null);
      const newProvider = await createServiceProvider(createForm);
      if (newProvider) {
        // Refresh providers
        const response = await getServiceProviders(filters);
        if (response?.success) {
          setProviders(response.data);
          setFilteredProviders(response.data);
        }
        setShowCreateModal(false);
        // Reset form
        setCreateForm({
          name: '',
          company: '',
          phoneNumber: '',
          email: '',
          serviceTypes: [],
          location: {
            city: '',
            area: '',
            coordinates: {
              latitude: 0,
              longitude: 0
            }
          },
          businessLicense: '',
          insuranceNumber: '',
          workingHours: {
            start: '08:00',
            end: '17:00',
            days: []
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create provider');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProvider = async () => {
    if (!selectedProvider) return;
    
    try {
      setLoading(true);
      setError(null);
      const updatedProvider = await updateServiceProvider(selectedProvider._id, editForm);
      if (updatedProvider) {
        // Refresh providers
        const response = await getServiceProviders(filters);
        if (response?.success) {
          setProviders(response.data);
          setFilteredProviders(response.data);
        }
        setShowEditModal(false);
        setSelectedProvider(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update provider');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setEditForm({
      name: provider.name,
      company: provider.company,
      phoneNumber: provider.phoneNumber,
      email: provider.email,
      serviceTypes: provider.serviceTypes,
      location: {
        city: provider.location.city,
        area: provider.location.area,
        coordinates: {
          latitude: provider.location.coordinates.latitude,
          longitude: provider.location.coordinates.longitude
        }
      },
      businessLicense: provider.businessLicense,
      insuranceNumber: provider.insuranceNumber,
      workingHours: {
        start: provider.workingHours.start,
        end: provider.workingHours.end,
        days: provider.workingHours.days
      }
    });
    setShowEditModal(true);
  };

  const getServiceTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      plumbing: 'bg-blue-100 text-blue-800',
      electrical: 'bg-yellow-100 text-yellow-800',
      hvac: 'bg-green-100 text-green-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Service Providers</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="w-full sm:w-auto flex items-stretch sm:items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base shadow-sm"
                >
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Provider
                </button>
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

          {currentProviders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || Object.keys(filters).some(key => filters[key as keyof ServiceProviderFilters]) ? 'No providers found' : 'No providers yet'}
                </h3>
                <p className="text-gray-500 text-base sm:text-lg">
                  {searchTerm || Object.keys(filters).some(key => filters[key as keyof ServiceProviderFilters]) ? 'Try adjusting your filters' : 'Service providers will appear here once added'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {/* Mac/iOS Style Data Table */}
              <div className="bg-white border border-gray-200/50 rounded-2xl mx-4 sm:mx-6 my-4 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-3">
                  <div className="grid grid-cols-11 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="col-span-3">Provider</div>
                    <div className="col-span-2">Company</div>
                    <div className="col-span-2">Services</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200/50">
                  {currentProviders.map((provider) => (
                    <div 
                      key={provider._id} 
                      className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <div className="grid grid-cols-11 gap-4 items-center">
                        {/* Provider Info */}
                        <div className="col-span-3 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {provider.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {provider.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {provider.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {provider.company}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {provider.phoneNumber}
                          </p>
                        </div>

                        {/* Services */}
                        <div className="col-span-2">
                          <div className="flex flex-wrap gap-1">
                            {provider.serviceTypes.slice(0, 2).map((type) => (
                              <span
                                key={type}
                                className={`px-2 py-1 rounded text-xs font-medium ${getServiceTypeColor(type)}`}
                              >
                                {type}
                              </span>
                            ))}
                            {provider.serviceTypes.length > 2 && (
                              <span className="text-xs text-gray-500">+{provider.serviceTypes.length - 2}</span>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                          <p className="text-sm text-gray-900 truncate">
                            {provider.location.city}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {provider.location.area}
                          </p>
                        </div>


                        {/* Status */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            {provider.isVerified ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(provider);
                              }}
                              disabled={actionLoading === provider._id}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProvider(provider);
                              }}
                              disabled={actionLoading === provider._id}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === provider._id ? (
                                <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
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
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProviders.length)} of {filteredProviders.length} providers
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

      {/* Provider Details Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedProvider.name}</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">{selectedProvider.company}</p>
                </div>
                <button
                  onClick={() => setSelectedProvider(null)}
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
                {/* Provider Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedProvider.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Provider Details</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Service provider information</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${selectedProvider.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {selectedProvider.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Contact</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Provider contact details</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Email:</span>
                        <span className="font-medium text-sm">{selectedProvider.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Phone:</span>
                        <span className="font-medium text-sm">{selectedProvider.phoneNumber}</span>
                      </div>
                      {selectedProvider.businessLicense && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">License:</span>
                          <span className="font-medium text-sm">{selectedProvider.businessLicense}</span>
                        </div>
                      )}
                      {selectedProvider.insuranceNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm">Insurance:</span>
                          <span className="font-medium text-sm">{selectedProvider.insuranceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Location</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Service area</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">City:</span>
                        <span className="font-medium text-sm">{selectedProvider.location.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Area:</span>
                        <span className="font-medium text-sm">{selectedProvider.location.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Created:</span>
                        <span className="font-medium text-sm">{formatDate(selectedProvider.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services & Working Hours */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Services</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Service types offered</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.serviceTypes.map((type) => (
                        <span
                          key={type}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${getServiceTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Working Hours</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Availability schedule</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Hours:</span>
                        <span className="font-medium text-sm">{selectedProvider.workingHours.start} - {selectedProvider.workingHours.end}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Days:</span>
                        <span className="font-medium text-sm">{selectedProvider.workingHours.days.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Provider Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Add New Provider</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Create a new service provider</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Provider Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Provider Details</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Service provider information</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Name</span>
                      </div>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Company</span>
                      </div>
                      <input
                        type="text"
                        value={createForm.company}
                        onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="PlumbPro Ltd"
                      />
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Phone</span>
                      </div>
                      <input
                        type="tel"
                        value={createForm.phoneNumber}
                        onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="+254712345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Contact Info */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Contact</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Contact information</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="john@plumbpro.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Location</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Service area</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={createForm.location.city}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            location: { ...createForm.location, city: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Nairobi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                        <input
                          type="text"
                          value={createForm.location.area}
                          onChange={(e) => setCreateForm({ 
                            ...createForm, 
                            location: { ...createForm.location, area: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Westlands"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Types */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Service Types *</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Select services offered</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['plumbing', 'electrical', 'hvac', 'general'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={createForm.serviceTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                serviceTypes: [...createForm.serviceTypes, type]
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                serviceTypes: createForm.serviceTypes.filter(t => t !== type)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Business Details</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Licenses and insurance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                      <input
                        type="text"
                        value={createForm.businessLicense}
                        onChange={(e) => setCreateForm({ ...createForm, businessLicense: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="BL123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                      <input
                        type="text"
                        value={createForm.insuranceNumber}
                        onChange={(e) => setCreateForm({ ...createForm, insuranceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="IN789012"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Working Hours</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Availability schedule</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={createForm.workingHours.start}
                        onChange={(e) => setCreateForm({ 
                          ...createForm, 
                          workingHours: { ...createForm.workingHours, start: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={createForm.workingHours.end}
                        onChange={(e) => setCreateForm({ 
                          ...createForm, 
                          workingHours: { ...createForm.workingHours, end: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={createForm.workingHours.days.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  workingHours: {
                                    ...createForm.workingHours,
                                    days: [...createForm.workingHours.days, day]
                                  }
                                });
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  workingHours: {
                                    ...createForm.workingHours,
                                    days: createForm.workingHours.days.filter(d => d !== day)
                                  }
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-t border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProvider}
                  disabled={loading || !createForm.name || !createForm.company || !createForm.phoneNumber || !createForm.email || !createForm.location.city || createForm.serviceTypes.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Edit Provider</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Update service provider information</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Provider Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Provider Details</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Service provider information</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Name</span>
                      </div>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Company</span>
                      </div>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="PlumbPro Ltd"
                      />
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Phone</span>
                      </div>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="+254712345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Contact Info */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Contact</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Contact information</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="john@plumbpro.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Location</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Service area</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={editForm.location.city}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            location: { ...editForm.location, city: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Nairobi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                        <input
                          type="text"
                          value={editForm.location.area}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            location: { ...editForm.location, area: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Westlands"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Types */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Service Types *</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Select services offered</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['plumbing', 'electrical', 'hvac', 'general'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={editForm.serviceTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditForm({
                                ...editForm,
                                serviceTypes: [...editForm.serviceTypes, type]
                              });
                            } else {
                              setEditForm({
                                ...editForm,
                                serviceTypes: editForm.serviceTypes.filter(t => t !== type)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Business Details</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Licenses and insurance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                      <input
                        type="text"
                        value={editForm.businessLicense}
                        onChange={(e) => setEditForm({ ...editForm, businessLicense: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="BL123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                      <input
                        type="text"
                        value={editForm.insuranceNumber}
                        onChange={(e) => setEditForm({ ...editForm, insuranceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="IN789012"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Working Hours</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Availability schedule</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editForm.workingHours.start}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          workingHours: { ...editForm.workingHours, start: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={editForm.workingHours.end}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          workingHours: { ...editForm.workingHours, end: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <label key={day} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={editForm.workingHours.days.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  workingHours: {
                                    ...editForm.workingHours,
                                    days: [...editForm.workingHours.days, day]
                                  }
                                });
                              } else {
                                setEditForm({
                                  ...editForm,
                                  workingHours: {
                                    ...editForm.workingHours,
                                    days: editForm.workingHours.days.filter(d => d !== day)
                                  }
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-t border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProvider}
                  disabled={loading || !editForm.name || !editForm.company || !editForm.phoneNumber || !editForm.email || !editForm.location.city || editForm.serviceTypes.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && providerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Provider</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <span className="font-semibold">{providerToDelete.name}</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This will permanently remove the provider and all associated data.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setProviderToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading === providerToDelete._id}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === providerToDelete._id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Provider'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
