// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAgreementsService, type Agreement } from '../../services/agreements/agreements.service';
import { useAuth } from '../../context/AuthContext';
import { Plus, X, Search as SearchIcon } from 'lucide-react';

// Signature Image Component with Loading State
function SignatureImage({ src, alt }: { src: string; alt: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative">
      {loading && (
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
            <span className="text-xs text-gray-500">Loading signature...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-xs text-gray-500">Failed to load signature</span>
          </div>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`max-w-full h-auto rounded-lg transition-opacity duration-300 ${loading ? 'opacity-0 absolute' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function AgreementsPage() {
  const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);
  const [filteredAgreements, setFilteredAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    landlordId: '',
    tenantId: '',
    propertyId: '',
    rentAmount: '',
    depositAmount: '',
    startDate: '',
    endDate: '',
    zeroDeposit: false,
    utilitiesIncluded: false,
    utilitiesList: [] as string[],
    maintenanceIncluded: false,
    paymentFrequency: 'monthly',
    paymentDueDay: '1',
    lateFee: '',
    gracePeriod: '',
    terms: [] as string[],
    specialConditions: [] as string[],
  });

  // Data for dropdowns - using connected parties structure
  const [connectedParties, setConnectedParties] = useState<any>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const { getAgreements, createAgreement, getConnectedParties } = useAgreementsService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchAgreements = async () => {
      try {
        setLoading(true);
        const response = await getAgreements(); // Use new endpoint
        if (response?.success) {
          setAllAgreements(response.data);
        } else {
          setError('Failed to fetch agreements');
        }
      } catch (err) {
        setError('Error loading agreements');
        console.error('Error fetching agreements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreements();
  }, [getAgreements, authLoading]);

  // Fetch connected parties when modal opens
  useEffect(() => {
    if (showCreateModal && !authLoading) {
      fetchConnectedParties();
    }
  }, [showCreateModal, authLoading]);

  // Update selected landlord when formData.landlordId changes
  useEffect(() => {
    if (formData.landlordId && connectedParties?.data?.landlords) {
      const landlord = connectedParties.data.landlords.find((l: any) => l.id === formData.landlordId);
      setSelectedLandlord(landlord || null);
    } else {
      setSelectedLandlord(null);
    }
  }, [formData.landlordId, connectedParties]);

  // Update selected property and auto-select tenant when property is selected
  useEffect(() => {
    if (formData.propertyId && selectedLandlord) {
      const property = selectedLandlord.properties.find((p: any) => p.id === formData.propertyId);
      setSelectedProperty(property || null);
      if (property && property.tenants && property.tenants.length > 0) {
        setAvailableTenants(property.tenants);
        // Auto-select the first connected tenant
        if (property.tenants.length === 1) {
          setFormData(prev => ({ ...prev, tenantId: property.tenants[0].id }));
        } else if (!formData.tenantId || !property.tenants.find((t: any) => t.id === formData.tenantId)) {
          // If multiple tenants, select the first one by default
          setFormData(prev => ({ ...prev, tenantId: property.tenants[0].id }));
        }
      } else {
        setAvailableTenants([]);
        setFormData(prev => ({ ...prev, tenantId: '' }));
      }
    } else {
      setSelectedProperty(null);
      setAvailableTenants([]);
      setFormData(prev => ({ ...prev, tenantId: '' }));
    }
  }, [formData.propertyId, selectedLandlord]);

  const fetchConnectedParties = async () => {
    try {
      setLoadingData(true);
      const response = await getConnectedParties();
      
      if (response?.success) {
        setConnectedParties(response);
      } else {
        setError('Failed to fetch connected parties');
      }
    } catch (err) {
      console.error('Error fetching connected parties:', err);
      setError('Error loading connected parties');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateAgreement = async () => {
    // Basic validation
    if (!formData.title || !formData.landlordId || !formData.tenantId || !formData.propertyId) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    if (!formData.rentAmount || parseFloat(formData.rentAmount) <= 0) {
      setError('Rent amount must be greater than 0');
      return;
    }

    if (formData.zeroDeposit && parseFloat(formData.depositAmount) !== 0) {
      setError('Deposit amount must be 0 when zero deposit is enabled');
      return;
    }

    // Validate tenant is connected to selected property
    if (!formData.tenantId) {
      setError('No tenant found for the selected property. Please ensure the property has a connected tenant.');
      return;
    }

    if (selectedProperty && !selectedProperty.tenants.find((t: any) => t.id === formData.tenantId)) {
      setError('Selected tenant is not connected to the selected property');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const agreementPayload: any = {
        landlordId: formData.landlordId,
        tenantId: formData.tenantId,
        propertyId: formData.propertyId,
        title: formData.title,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        rentAmount: parseFloat(formData.rentAmount),
        depositAmount: parseFloat(formData.depositAmount) || 0,
        zeroDeposit: formData.zeroDeposit,
      };

      // Add optional fields
      if (formData.description) {
        agreementPayload.description = formData.description;
      }

      if (formData.utilitiesIncluded) {
        agreementPayload.utilitiesIncluded = formData.utilitiesIncluded;
        if (formData.utilitiesList.length > 0) {
          agreementPayload.utilitiesList = formData.utilitiesList;
        }
      }

      if (formData.maintenanceIncluded) {
        agreementPayload.maintenanceIncluded = formData.maintenanceIncluded;
      }

      // Payment schedule
      if (formData.paymentFrequency || formData.paymentDueDay || formData.lateFee || formData.gracePeriod) {
        agreementPayload.paymentSchedule = {
          frequency: formData.paymentFrequency,
          dueDay: parseInt(formData.paymentDueDay) || 1,
        };
        if (formData.lateFee) {
          agreementPayload.paymentSchedule.lateFee = parseFloat(formData.lateFee);
        }
        if (formData.gracePeriod) {
          agreementPayload.paymentSchedule.gracePeriod = parseInt(formData.gracePeriod);
        }
      }

      // Terms and conditions
      if (formData.terms.length > 0) {
        agreementPayload.terms = formData.terms;
      }

      if (formData.specialConditions.length > 0) {
        agreementPayload.specialConditions = formData.specialConditions;
      }

      const response = await createAgreement(agreementPayload);
      
      if (response?.success) {
        setSuccessMessage('Agreement created successfully! Both landlord and tenant will receive email notifications.');
        setShowCreateModal(false);
        // Reset form
        setFormData({
          title: '',
          description: '',
          landlordId: '',
          tenantId: '',
          propertyId: '',
          rentAmount: '',
          depositAmount: '',
          startDate: '',
          endDate: '',
          zeroDeposit: false,
          utilitiesIncluded: false,
          utilitiesList: [],
          maintenanceIncluded: false,
          paymentFrequency: 'monthly',
          paymentDueDay: '1',
          lateFee: '',
          gracePeriod: '',
          terms: [],
          specialConditions: [],
        });
        setSelectedLandlord(null);
        setSelectedProperty(null);
        setAvailableTenants([]);
        // Refresh agreements list
        const agreementsRes = await getAgreements();
        if (agreementsRes?.success) {
          setAllAgreements(agreementsRes.data);
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError('Failed to create agreement');
      }
    } catch (err) {
      console.error('Error creating agreement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create agreement');
    } finally {
      setCreating(false);
    }
  };

  // Filter agreements based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAgreements(allAgreements);
    } else {
      const filtered = allAgreements.filter(agreement =>
        (agreement.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.description || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.tenantId?.firstName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.tenantId?.lastName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.tenantId?.email || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.landlordId?.firstName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.landlordId?.lastName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.landlordId?.email || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.propertyId?.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.propertyId?.address?.city || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agreement.propertyId?.address?.street || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgreements(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, allAgreements]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAgreements = filteredAgreements.slice(startIndex, endIndex);

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
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50/30 min-h-screen">
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agreements</h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredAgreements.length} agreement{filteredAgreements.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none sm:w-80 lg:w-96">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search agreements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create Agreement
              </button>
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

          {successMessage && (
            <div className="mx-4 sm:mx-6 mt-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl p-4">
              <p className="text-green-800 text-sm sm:text-base">{successMessage}</p>
            </div>
          )}

          {currentAgreements.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No agreements found' : 'No agreements yet'}
                </h3>
                <p className="text-gray-500 text-base sm:text-lg">
                  {searchTerm ? 'Try adjusting your search terms' : 'Agreements will appear here once created'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
              <div className="space-y-3 sm:space-y-4">
                {currentAgreements.map((agreement) => (
                  <div 
                    key={agreement._id} 
                    className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 sm:p-6 hover:bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedAgreement(agreement)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                          {agreement.title || 'Untitled Agreement'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                          {agreement.description || 'No description'}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="truncate">{formatPrice(agreement.rentAmount || 0)}/month</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 ml-4">
                        <span className={`inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-full ${getStatusColor(agreement.status)}`}>
                          {agreement.status || 'Unknown'}
                        </span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Tenant */}
                      <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-xs sm:text-sm">
                            {agreement.tenantId?.firstName?.[0]}{agreement.tenantId?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {agreement.tenantId?.firstName || 'N/A'} {agreement.tenantId?.lastName || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">Tenant</p>
                        </div>
                      </div>

                      {/* Landlord */}
                      <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-xl">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-xs sm:text-sm">
                            {agreement.landlordId?.firstName?.[0]}{agreement.landlordId?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {agreement.landlordId?.firstName || 'N/A'} {agreement.landlordId?.lastName || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">Landlord</p>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="mt-4 p-3 bg-gray-50/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Property</span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium truncate">
                        {agreement.propertyId?.title || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {agreement.propertyId?.address?.street || 'N/A'}, {agreement.propertyId?.address?.city || 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-gray-200/60 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredAgreements.length)} of {filteredAgreements.length} agreements
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

      {/* iOS-style Agreement Details Modal */}
      {selectedAgreement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-7xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            {/* iOS-style Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedAgreement.title}</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base line-clamp-2">{selectedAgreement.description}</p>
                </div>
                <button
                  onClick={() => setSelectedAgreement(null)}
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
                {/* Agreement Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Agreement Overview</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Rental agreement details</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(selectedAgreement.status)}`}>
                      {selectedAgreement.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Rent</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedAgreement.rentAmount)}</p>
                      <p className="text-xs text-gray-500">per month</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Deposit</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(selectedAgreement.depositAmount)}</p>
                      <p className="text-xs text-gray-500">security deposit</p>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Duration</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatDate(selectedAgreement.startDate)}</p>
                      <p className="text-xs text-gray-500">to {formatDate(selectedAgreement.endDate)}</p>
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
                          {selectedAgreement.tenantId?.firstName?.[0]}{selectedAgreement.tenantId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Tenant</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Rental party</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedAgreement.tenantId?.firstName || 'N/A'} {selectedAgreement.tenantId?.lastName || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedAgreement.tenantId?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Landlord */}
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">
                          {selectedAgreement.landlordId?.firstName?.[0]}{selectedAgreement.landlordId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Landlord</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Property owner</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {selectedAgreement.landlordId?.firstName || 'N/A'} {selectedAgreement.landlordId?.lastName || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedAgreement.landlordId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Property</h4>
                      <p className="text-xs sm:text-sm text-gray-500">Rental property details</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {selectedAgreement.propertyId?.title || 'N/A'}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                      {selectedAgreement.propertyId?.address?.street || 'N/A'}, {selectedAgreement.propertyId?.address?.city || 'N/A'}, {selectedAgreement.propertyId?.address?.state || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Signatures - Fixed to show actual signature images with loading */}
                {(selectedAgreement.tenantSignature || selectedAgreement.landlordSignature) && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900">Digital Signatures</h4>
                        <p className="text-sm text-gray-500">Signed agreement documents</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {selectedAgreement.tenantSignature && (
                        <div className="bg-gray-50/50 rounded-xl p-3 sm:p-4">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">T</span>
                            </div>
                            <span className="text-sm sm:text-base">Tenant Signature</span>
                          </h5>
                          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 mb-3">
                            <SignatureImage 
                              src={selectedAgreement.tenantSignature.signatureUrl} 
                              alt="Tenant Signature" 
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Signed: {formatDate(selectedAgreement.tenantSignature.signedAt)}
                          </div>
                        </div>
                      )}
                      
                      {selectedAgreement.landlordSignature && (
                        <div className="bg-gray-50/50 rounded-xl p-3 sm:p-4">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">L</span>
                            </div>
                            <span className="text-sm sm:text-base">Landlord Signature</span>
                          </h5>
                          <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 mb-3">
                            <SignatureImage 
                              src={selectedAgreement.landlordSignature.signatureUrl} 
                              alt="Landlord Signature" 
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Signed: {formatDate(selectedAgreement.landlordSignature.signedAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                {selectedAgreement.terms && selectedAgreement.terms.length > 0 && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Terms & Conditions</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Agreement terms</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedAgreement.terms.map((term, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-xs sm:text-sm text-gray-700">{term}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedAgreement.attachments && selectedAgreement.attachments.length > 0 && (
                  <div className="bg-white border border-gray-200/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Attachments</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Document attachments</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedAgreement.attachments.map((attachment, index) => (
                        <a 
                          key={index}
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">Attachment {index + 1}</span>
                          <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Agreement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Create New Agreement</h2>
                  <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new rental agreement</p>
                </div>
                <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                      setFormData({
                        title: '',
                        description: '',
                        landlordId: '',
                        tenantId: '',
                        propertyId: '',
                        rentAmount: '',
                        depositAmount: '',
                        startDate: '',
                        endDate: '',
                        zeroDeposit: false,
                        utilitiesIncluded: false,
                        utilitiesList: [],
                        maintenanceIncluded: false,
                        paymentFrequency: 'monthly',
                        paymentDueDay: '1',
                        lateFee: '',
                        gracePeriod: '',
                        terms: [],
                        specialConditions: [],
                      });
                      setSelectedLandlord(null);
                      setSelectedProperty(null);
                      setAvailableTenants([]);
                    }}
                  className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(98vh-180px)] sm:max-h-[calc(95vh-180px)]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agreement Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Rental Agreement for 2BR Apartment"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Agreement description..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landlord <span className="text-red-500">*</span>
                    </label>
                    {loadingData ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100">
                        <p className="text-sm text-gray-500">Loading landlords...</p>
                      </div>
                    ) : !connectedParties?.data?.landlords || connectedParties.data.landlords.length === 0 ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-yellow-50">
                        <p className="text-sm text-yellow-700">No landlords with connected tenants found</p>
                      </div>
                    ) : (
                      <select
                        value={formData.landlordId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, landlordId: e.target.value, propertyId: '', tenantId: '' }));
                          setSelectedLandlord(null);
                          setSelectedProperty(null);
                          setAvailableTenants([]);
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Landlord</option>
                        {connectedParties.data.landlords.map((landlord: any) => (
                          <option key={landlord.id} value={landlord.id}>
                            {landlord.fullName} ({landlord.email}) - {landlord.properties?.length || 0} properties
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {formData.propertyId && selectedProperty && availableTenants.length > 0 && formData.tenantId && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-medium text-blue-900 mb-1">Selected Tenant:</p>
                      <p className="text-sm text-blue-700">
                        {availableTenants.find((t: any) => t.id === formData.tenantId)?.fullName || 'Auto-selected from property connection'}
                        {availableTenants.find((t: any) => t.id === formData.tenantId) && (
                          <span className="text-blue-600"> ({availableTenants.find((t: any) => t.id === formData.tenantId)?.email})</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Property */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property <span className="text-red-500">*</span>
                    </label>
                    {loadingData ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100">
                        <p className="text-sm text-gray-500">Loading properties...</p>
                      </div>
                    ) : !formData.landlordId ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-100">
                        <p className="text-sm text-gray-500">Please select a landlord first</p>
                      </div>
                    ) : !selectedLandlord || !selectedLandlord.properties || selectedLandlord.properties.length === 0 ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-yellow-50">
                        <p className="text-sm text-yellow-700">No properties with connected tenants found for selected landlord</p>
                      </div>
                    ) : (
                      <select
                        value={formData.propertyId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, propertyId: e.target.value, tenantId: '' }));
                          setSelectedProperty(null);
                          setAvailableTenants([]);
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Property</option>
                        {selectedLandlord.properties.map((property: any) => (
                          <option key={property.id} value={property.id}>
                            {property.title} - {property.address.street}, {property.address.city} ({property.tenants?.length || 0} connected tenants)
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedProperty && selectedProperty.tenants && selectedProperty.tenants.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedProperty.tenants.length} tenant{selectedProperty.tenants.length !== 1 ? 's' : ''} connected to this property
                        {selectedProperty.tenants.length === 1 && formData.tenantId && (
                          <span className="text-green-600 ml-2">✓ Tenant auto-selected</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.rentAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={formData.zeroDeposit}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.zeroDeposit}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            zeroDeposit: e.target.checked,
                            depositAmount: e.target.checked ? '0' : prev.depositAmount
                          }));
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Zero Deposit Protection</span>
                    </label>
                    {formData.zeroDeposit && (
                      <p className="text-xs text-gray-500 mt-1 ml-6">Deposit amount will be set to 0</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Period</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={formData.startDate}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Frequency
                      </label>
                      <select
                        value={formData.paymentFrequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentFrequency: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Due Day (1-31)
                      </label>
                      <input
                        type="number"
                        value={formData.paymentDueDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDay: e.target.value }))}
                        min="1"
                        max="31"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee Amount
                      </label>
                      <input
                        type="number"
                        value={formData.lateFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, lateFee: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grace Period (days)
                      </label>
                      <input
                        type="number"
                        value={formData.gracePeriod}
                        onChange={(e) => setFormData(prev => ({ ...prev, gracePeriod: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.utilitiesIncluded}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilitiesIncluded: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Utilities Included</span>
                    </label>
                    {formData.utilitiesIncluded && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Utilities List (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formData.utilitiesList.join(', ')}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                            setFormData(prev => ({ ...prev, utilitiesList: list }));
                          }}
                          placeholder="Water, Electricity, Internet"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.maintenanceIncluded}
                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceIncluded: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Maintenance Included</span>
                    </label>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Terms (one per line)
                      </label>
                      <textarea
                        value={formData.terms.join('\n')}
                        onChange={(e) => {
                          const terms = e.target.value.split('\n').map(item => item.trim()).filter(item => item);
                          setFormData(prev => ({ ...prev, terms }));
                        }}
                        placeholder="Enter terms, one per line..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Conditions (one per line)
                      </label>
                      <textarea
                        value={formData.specialConditions.join('\n')}
                        onChange={(e) => {
                          const conditions = e.target.value.split('\n').map(item => item.trim()).filter(item => item);
                          setFormData(prev => ({ ...prev, specialConditions: conditions }));
                        }}
                        placeholder="Enter special conditions, one per line..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                      setFormData({
                        title: '',
                        description: '',
                        landlordId: '',
                        tenantId: '',
                        propertyId: '',
                        rentAmount: '',
                        depositAmount: '',
                        startDate: '',
                        endDate: '',
                        zeroDeposit: false,
                        utilitiesIncluded: false,
                        utilitiesList: [],
                        maintenanceIncluded: false,
                        paymentFrequency: 'monthly',
                        paymentDueDay: '1',
                        lateFee: '',
                        gracePeriod: '',
                        terms: [],
                        specialConditions: [],
                      });
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAgreement}
                    disabled={creating}
                    className="px-6 py-2.5 bg-blue-500 text-white hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Agreement'}
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
