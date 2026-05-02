// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePropertiesService, type Property } from '@/app/services/properties/properties.service';
import { useAuth } from '@/app/context/AuthContext';
import { useFetchWithAuth } from '@/app/context/fetchWithAuth';
import { API_CONFIG } from '@/app/config/api.config';
import { FileText, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type Props = {
  /** When false, skip fetching until user opens this tab (parent controls mount or pass enabled). */
  enabled: boolean;
};

function hasProofDocs(p: Property) {
  const docs = (p as any).propertyProofDocuments;
  return Array.isArray(docs) && docs.length > 0;
}

function isVerifiedProperty(p: Property) {
  return (p as any).isVerified === true || (p as any).verificationStatus === 'verified';
}

export default function PropertyVerificationQueue({ enabled }: Props) {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [queueOnly, setQueueOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'documents'>('images');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { getProperties } = usePropertiesService();
  const { loading: authLoading } = useAuth();
  const fetchWithAuth = useFetchWithAuth();

  const loadProperties = useCallback(async () => {
    if (!enabled || authLoading) return;
    try {
      setLoading(true);
      setError(null);
      const response = await getProperties(1, 100);
      if (response?.success) {
        setAllProperties(response.data.properties);
      } else {
        setError('Failed to fetch properties');
      }
    } catch (err) {
      setError('Error loading properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [enabled, authLoading, getProperties]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    let list = allProperties;
    if (queueOnly) {
      list = list.filter((p) => !isVerifiedProperty(p) && hasProofDocs(p));
    }
    if (!searchTerm.trim()) {
      setFilteredProperties(list);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredProperties(
        list.filter(
          (property) =>
            (property.title || '').toString().toLowerCase().includes(q) ||
            (property.description || '').toString().toLowerCase().includes(q) ||
            (property.address?.city || '').toString().toLowerCase().includes(q) ||
            (property.address?.street || '').toString().toLowerCase().includes(q) ||
            (property.landlordId?.firstName || '').toString().toLowerCase().includes(q) ||
            (property.landlordId?.lastName || '').toString().toLowerCase().includes(q)
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, allProperties, queueOnly]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const pendingCount = allProperties.filter((p) => !isVerifiedProperty(p) && hasProofDocs(p)).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const handleVerifyProperty = async () => {
    if (!selectedProperty) return;
    try {
      setActionLoading(true);
      setError(null);
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/properties/admin/${selectedProperty._id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedProperty = data.data || { isVerified: true, verificationStatus: 'verified' };
        setAllProperties((prev) => prev.map((p) => (p._id === selectedProperty._id ? { ...p, ...updatedProperty } : p)));
        setSelectedProperty((prev) => (prev ? { ...prev, ...updatedProperty } : null));
      } else {
        setError(data.message || 'Failed to verify property');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify property');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProperty = async () => {
    if (!selectedProperty || !rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      setError(null);
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/properties/admin/${selectedProperty._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.data) {
        const updatedProperty = data.data;
        setAllProperties((prev) => prev.map((p) => (p._id === selectedProperty._id ? { ...p, ...updatedProperty } : p)));
        setSelectedProperty((prev) => (prev ? { ...prev, ...updatedProperty } : null));
        setShowRejectionModal(false);
        setRejectionReason('');
      } else {
        setError(data.message || 'Failed to reject property');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject property');
    } finally {
      setActionLoading(false);
    }
  };

  const closeImageDialog = () => {
    setShowImageDialog(false);
    setSelectedProperty(null);
    setActiveTab('images');
    setError(null);
    setShowRejectionModal(false);
    setRejectionReason('');
  };

  if (!enabled) return null;

  if (authLoading || loading) {
    return (
      <div className="flex flex-col px-4 sm:px-6 py-8">
        <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200/60 bg-white/50">
        <p className="text-sm text-gray-600">
          Property proof verification — approve or reject listings with uploaded proof documents.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={queueOnly}
              onChange={(e) => setQueueOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show pending verification only ({pendingCount})
          </label>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-black"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {currentProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              {queueOnly ? 'No properties pending verification' : 'No properties found'}
            </h3>
            <p className="text-gray-500 text-sm mt-1 max-w-md">
              {queueOnly
                ? 'Try turning off “pending only” to browse all properties, or adjust search.'
                : 'Try adjusting your search.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProperties.map((property) => (
                <div
                  key={property._id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && (setSelectedProperty(property), setShowImageDialog(true), setActiveTab('images'))}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedProperty(property);
                    setShowImageDialog(true);
                    setActiveTab('images');
                  }}
                >
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {property.images?.mainImage ? (
                      <img src={property.images.mainImage} alt={property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          isVerifiedProperty(property) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isVerifiedProperty(property) ? 'Verified' : 'Pending proof'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{(property.title || 'Untitled').toString()}</h3>
                      <span className="text-lg font-bold text-purple-600 shrink-0">{formatPrice(property.price || 0)}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      {(property.address?.city || '—').toString()}, {(property.address?.state || '—').toString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 text-sm text-gray-700">
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showImageDialog && selectedProperty && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedProperty.title || 'Property'}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedProperty.address?.city}, {selectedProperty.address?.state}
                </p>
              </div>
              <button type="button" onClick={closeImageDialog} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'images' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                }`}
              >
                Documents
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeTab === 'images' ? (
                <div className="space-y-6">
                  {selectedProperty.images?.mainImage && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Main Image</h3>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <img src={selectedProperty.images.mainImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {selectedProperty.images?.gallery?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Gallery</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedProperty.images.gallery.map((image, index) => (
                          <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img src={image} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProperty.images?.floorPlan && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Floor Plan</h3>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <img src={selectedProperty.images.floorPlan} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {selectedProperty.images?.virtualTour && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Virtual Tour</h3>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <iframe src={selectedProperty.images.virtualTour} className="w-full h-full" title="Virtual tour" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border ${
                      isVerifiedProperty(selectedProperty) ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      Verification: {isVerifiedProperty(selectedProperty) ? 'Verified' : 'Pending review'}
                    </p>
                  </div>

                  {(selectedProperty as any).propertyProofDocuments?.length > 0 ? (
                    <div className="space-y-4">
                      {(selectedProperty as any).propertyProofDocuments.map((docUrl: string, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">Document {index + 1}</p>
                              <p className="text-xs text-gray-500 truncate">{docUrl.split('/').pop()?.split('?')[0] || 'Proof'}</p>
                            </div>
                          </div>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No proof documents uploaded.</p>
                  )}

                  {!isVerifiedProperty(selectedProperty) &&
                    (selectedProperty as any).propertyProofDocuments?.length > 0 && (
                      <div className="pt-4 border-t flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowRejectionModal(true)}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-red-500 text-white rounded-xl disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyProperty}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-green-600 text-white rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Approve
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && selectedProperty && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject property</h3>
              <button type="button" onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }} className="p-2 hover:bg-gray-100 rounded-full">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full p-3 border rounded-xl text-black"
              placeholder="Reason for the landlord..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-4 py-2 bg-gray-100 rounded-xl" onClick={() => { setShowRejectionModal(false); setRejectionReason(''); }}>
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-xl disabled:opacity-50"
                onClick={() => rejectionReason.trim() && handleRejectProperty()}
              >
                {actionLoading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
