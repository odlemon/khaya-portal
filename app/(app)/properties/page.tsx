// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { usePropertiesService, type Property } from '../../services/properties/properties.service';
import { useAuth } from '../../context/AuthContext';
import { useFetchWithAuth } from '../../context/fetchWithAuth';
import { API_CONFIG } from '../../config/api.config';
import { FileText, Download, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PropertiesPage() {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalProperties, setTotalProperties] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'documents'>('images');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { getProperties } = usePropertiesService();
  const { loading: authLoading } = useAuth();
  const fetchWithAuth = useFetchWithAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await getProperties(1, 100); // Fetch all properties for local search
        if (response?.success) {
          setAllProperties(response.data.properties);
          setTotalProperties(response.data.pagination.total);
        } else {
          setError('Failed to fetch properties');
        }
      } catch (err) {
        setError('Error loading properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [getProperties, authLoading]);

  // Filter properties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProperties(allProperties);
    } else {
      const filtered = allProperties.filter(property =>
        (property.title || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.description || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.address?.city || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.address?.street || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.landlordId?.firstName || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (property.landlordId?.lastName || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, allProperties]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

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

  const handleVerifyProperty = async () => {
    if (!selectedProperty) return;
    try {
      setActionLoading(true);
      setError(null);
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/properties/admin/${selectedProperty._id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        // Update the property in the list
        setAllProperties(prev => prev.map(p => 
          p._id === selectedProperty._id 
            ? { ...p, isVerified: true, verificationStatus: 'verified' }
            : p
        ));
        // Update selected property
        setSelectedProperty(prev => prev ? { ...prev, isVerified: true, verificationStatus: 'verified' } : null);
      } else {
        setError(data.message || 'Failed to verify property');
      }
    } catch (err) {
      console.error('Error verifying property:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify property');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setShowImageDialog(true);
    setActiveTab('images');
  };

  const closeImageDialog = () => {
    setShowImageDialog(false);
    setSelectedProperty(null);
    setActiveTab('images');
    setError(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
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
            <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
            <p className="text-sm text-gray-500 mt-1">{totalProperties} properties</p>
          </div>
          <div className="w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {currentProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No properties found' : 'No properties yet'}
              </h3>
              <p className="text-gray-500 text-center max-w-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Properties will appear here when they are added'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentProperties.map((property) => (
                  <div 
                    key={property._id} 
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handlePropertyClick(property)}
                  >
                    {/* Property Image */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {property.images?.mainImage ? (
                        <img 
                          src={property.images.mainImage} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          (property.status || '') === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {(property.status || '') === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {(property.title || 'Untitled Property').toString()}
                        </h3>
                        <span className="text-lg font-bold text-purple-600">
                          {formatPrice(property.price || 0)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {(property.description || 'No description available').toString()}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          <span>{property.bedrooms || 0} bed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          <span>{property.bathrooms || 0} bath</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span>{property.area || 0} sq ft</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {(property.address?.city || 'N/A').toString()}, {(property.address?.state || 'N/A').toString()}
                        </span>
                        <span className="text-gray-500">
                          {formatDate(property.createdAt || new Date().toISOString())}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
                    {searchTerm && ` (filtered from ${totalProperties} total)`}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Image Dialog */}
      {showImageDialog && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProperty.title || 'Property Details'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedProperty.address?.city}, {selectedProperty.address?.state}
                </p>
              </div>
              <button
                onClick={closeImageDialog}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Documents
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeTab === 'images' ? (
              <div className="space-y-6">
                {/* Main Image */}
                {selectedProperty.images?.mainImage && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Main Image</h3>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <img 
                        src={selectedProperty.images.mainImage} 
                        alt="Main property image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Gallery Images */}
                {selectedProperty.images?.gallery && selectedProperty.images.gallery.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedProperty.images.gallery.map((image, index) => (
                        <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={image} 
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floor Plan */}
                {selectedProperty.images?.floorPlan && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Floor Plan</h3>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <img 
                        src={selectedProperty.images.floorPlan} 
                        alt="Floor plan"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Virtual Tour */}
                {selectedProperty.images?.virtualTour && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Virtual Tour</h3>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <iframe 
                        src={selectedProperty.images.virtualTour}
                        className="w-full h-full"
                        title="Virtual tour"
                      />
                    </div>
                  </div>
                )}

                {/* No Images Message */}
                {!selectedProperty.images?.mainImage && 
                 (!selectedProperty.images?.gallery || selectedProperty.images.gallery.length === 0) &&
                 !selectedProperty.images?.floorPlan && 
                 !selectedProperty.images?.virtualTour && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Available</h3>
                    <p className="text-gray-500">This property doesn't have any images uploaded yet.</p>
                  </div>
                )}
              </div>
              ) : (
              <div className="space-y-4">
                {/* Verification Status */}
                {selectedProperty && (
                  <div className={`p-4 rounded-xl border ${
                    (selectedProperty as any).isVerified 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Verification Status: {(selectedProperty as any).isVerified ? 'Verified' : 'Not Verified'}
                        </p>
                      </div>
                      {(selectedProperty as any).isVerified && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedProperty && (selectedProperty as any).propertyProofDocuments && Array.isArray((selectedProperty as any).propertyProofDocuments) && (selectedProperty as any).propertyProofDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {(selectedProperty as any).propertyProofDocuments.map((docUrl: string, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Document {index + 1}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {docUrl.split('/').pop()?.split('?')[0] || 'Property proof document'}
                              </p>
                            </div>
                          </div>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Available</h3>
                    <p className="text-gray-500">This property doesn't have any property proof documents uploaded yet.</p>
                  </div>
                )}

                {/* Verify Button */}
                {selectedProperty && !(selectedProperty as any).isVerified && (selectedProperty as any).propertyProofDocuments && Array.isArray((selectedProperty as any).propertyProofDocuments) && (selectedProperty as any).propertyProofDocuments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleVerifyProperty}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {actionLoading ? 'Verifying...' : 'Verify Property'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
