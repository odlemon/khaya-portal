// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useFetchWithAuth } from '@/app/context/fetchWithAuth';
import { useAuth } from '@/app/context/AuthContext';
import { API_CONFIG } from '@/app/config/api.config';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  Calendar,
  AlertTriangle,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface DocumentInfo {
  url: string;
  type: string;
  uploadedAt: string;
  verified: boolean;
  selfieUrl?: string;
}

interface DocumentUrls {
  urls: string[];
  uploadedAt: string;
  verified: boolean;
}

interface VerificationRequest {
  userId: string;
  name: string;
  email: string;
  role: 'tenant' | 'landlord';
  status: 'pending' | 'verified' | 'rejected';
  documents: {
    idDocument?: DocumentInfo;
    payslips?: DocumentUrls;
    propertyProof?: DocumentUrls;
    utilityBills?: DocumentUrls;
    bankStatements?: DocumentUrls;
    employmentLetter?: DocumentInfo;
    propertyDocuments?: DocumentUrls;
  };
  adminFeedback?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
  verifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  rejectedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  userProfile?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
  };
}

interface VerificationResponse {
  success: boolean;
  message: string;
  data: VerificationRequest[];
}

export default function IncomingRequestsPage() {
  const [allRequests, setAllRequests] = useState<VerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tenant' | 'landlord'>('tenant');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchWithAuth = useFetchWithAuth();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    fetchRequests();
  }, [authLoading]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/documents/admin/all`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch requests: ${response.status} ${response.statusText}`);
      }
      
      const data: VerificationResponse = await response.json();
      setAllRequests(data.data);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch verification requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search term and filters
  useEffect(() => {
    let filtered = allRequests;

    // Role filter based on active tab
    filtered = filtered.filter(request => request.role === activeTab);

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(request =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, statusFilter, activeTab, allRequests]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileType = (url: string): 'image' | 'pdf' | 'docx' | 'other' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.pdf')) return 'pdf';
    if (lowerUrl.includes('.docx') || lowerUrl.includes('.doc')) return 'docx';
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return 'image';
    return 'other';
  };

  const renderIDPreview = (url: string, alt: string) => {
    const fileType = getFileType(url);
    
    if (fileType === 'image') {
      return (
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={url}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
      );
    } else if (fileType === 'pdf') {
      return (
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={url}
            className="w-full h-full"
            title={alt}
          />
        </div>
      );
    } else {
      // DOCX or other formats - show placeholder
      return (
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">Document</p>
            <p className="text-xs text-gray-500 mt-1">Click download to view</p>
          </div>
        </div>
      );
    }
  };

  const renderSelfiePreview = (url: string, alt: string) => {
    // Selfie is always an image
    return (
      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'verified': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tenant': return 'bg-blue-100 text-blue-700';
      case 'landlord': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(true);
      
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/documents/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: 'verified',
          adminFeedback: 'All documents verified successfully. User is now approved for platform access.'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to approve request: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Update the request status locally
      setAllRequests(prev => prev.map(req => 
        req.userId === userId 
          ? { ...req, status: 'verified' as const, verifiedAt: new Date().toISOString() }
          : req
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/documents/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: 'rejected',
          adminFeedback: rejectionReason,
          rejectionReason: rejectionReason
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reject request: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // Update the request status locally
      setAllRequests(prev => prev.map(req => 
        req.userId === userId 
          ? { ...req, status: 'rejected' as const, rejectedAt: new Date().toISOString(), rejectionReason }
          : req
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentCount = (request: VerificationRequest) => {
    let count = 0;
    if (request.documents.idDocument?.url) count++;
    if (request.documents.payslips?.urls?.length) count += request.documents.payslips.urls.length;
    if (request.documents.propertyProof?.urls?.length) count += request.documents.propertyProof.urls.length;
    if (request.documents.utilityBills?.urls?.length) count += request.documents.utilityBills.urls.length;
    if (request.documents.bankStatements?.urls?.length) count += request.documents.bankStatements.urls.length;
    if (request.documents.employmentLetter?.url) count++;
    if (request.documents.propertyDocuments?.urls?.length) count += request.documents.propertyDocuments.urls.length;
    return count;
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
              {authLoading ? 'Authentication is still loading. Please wait.' : 'Loading Requests'}
            </h3>
            <p className="text-gray-500 text-sm">
              {authLoading ? 'Please wait while we verify your authentication...' : 'Please wait while we fetch verification requests...'}
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Document Verifications</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Review and manage verification requests from landlords and tenants</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {filteredRequests.length} of {allRequests.length} requests
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 sm:mt-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('tenant')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tenant'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tenants ({allRequests.filter(r => r.role === 'tenant').length})
            </button>
            <button
              onClick={() => setActiveTab('landlord')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'landlord'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Landlords ({allRequests.filter(r => r.role === 'landlord').length})
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
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
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No requests found' : `No ${activeTab === 'tenant' ? 'tenant' : 'landlord'} requests yet`}
              </h3>
              <p className="text-gray-500 text-base sm:text-lg">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : `${activeTab === 'tenant' ? 'Tenant' : 'Landlord'} verification requests will appear here once submitted`}
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
                  <div className="col-span-3">User</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Documents</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Submitted</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200/50">
                {currentRequests.map((request) => (
                  <div 
                    key={request.userId} 
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* User */}
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {request.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {request.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(request.role)}`}>
                          {request.role === 'landlord' ? 'Landlord' : 'Tenant'}
                        </span>
                      </div>

                      {/* Documents */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {getDocumentCount(request)} files
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      {/* Submitted Date */}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-900">
                          {formatDate(request.submittedAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-3 h-3" />
                          Review
                        </button>
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Review Verification Request</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedRequest.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedRequest.submittedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h4>
                  <div className="space-y-3">
                    {selectedRequest.documents.idDocument?.url && (
                      <div className="p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900">ID Document ({selectedRequest.documents.idDocument.type})</span>
                        </div>
                        {selectedRequest.documents.idDocument.selfieUrl ? (
                          (() => {
                            const idFileType = getFileType(selectedRequest.documents.idDocument.url);
                            const canShowSideBySide = idFileType === 'image' || idFileType === 'pdf';
                            
                            if (canShowSideBySide) {
                              // Show ID and selfie side by side
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">ID Document</p>
                                    {renderIDPreview(selectedRequest.documents.idDocument.url, 'ID Document')}
                                    <a
                                      href={selectedRequest.documents.idDocument.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200 w-full justify-center"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download ID
                                    </a>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Selfie</p>
                                    {renderSelfiePreview(selectedRequest.documents.idDocument.selfieUrl, 'Selfie')}
                                    <a
                                      href={selectedRequest.documents.idDocument.selfieUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors duration-200 w-full justify-center"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download Selfie
                                    </a>
                                  </div>
                                </div>
                              );
                            } else {
                              // ID is DOCX or other format - show selfie and ID download separately
                              return (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Selfie</p>
                                    {renderSelfiePreview(selectedRequest.documents.idDocument.selfieUrl, 'Selfie')}
                                    <a
                                      href={selectedRequest.documents.idDocument.selfieUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors duration-200 w-full justify-center"
                                    >
                                      <Download className="w-4 h-4" />
                                      Download Selfie
                                    </a>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">ID Document</p>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm text-gray-700">ID Document ({idFileType.toUpperCase()})</span>
                                      </div>
                                      <a
                                        href={selectedRequest.documents.idDocument.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
                                      >
                                        <Download className="w-4 h-4" />
                                        Download ID
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          })()
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 max-w-md">
                              {renderIDPreview(selectedRequest.documents.idDocument.url, 'ID Document')}
                            </div>
                            <a
                              href={selectedRequest.documents.idDocument.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedRequest.documents.payslips?.urls?.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-900">Payslips ({selectedRequest.documents.payslips.urls.length} files)</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedRequest.documents.payslips.urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRequest.documents.propertyProof?.urls?.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <span className="font-medium text-gray-900">Property Proof ({selectedRequest.documents.propertyProof.urls.length} files)</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedRequest.documents.propertyProof.urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRequest.documents.utilityBills?.urls?.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-orange-500" />
                          <span className="font-medium text-gray-900">Utility Bills ({selectedRequest.documents.utilityBills.urls.length} files)</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedRequest.documents.utilityBills.urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRequest.documents.bankStatements?.urls?.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-500" />
                          <span className="font-medium text-gray-900">Bank Statements ({selectedRequest.documents.bankStatements.urls.length} files)</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedRequest.documents.bankStatements.urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedRequest.documents.employmentLetter?.url && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-teal-500" />
                          <span className="font-medium text-gray-900">Employment Letter</span>
                        </div>
                        <a
                          href={selectedRequest.documents.employmentLetter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-200 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    )}
                    {selectedRequest.documents.propertyDocuments?.urls?.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-900">Property Documents ({selectedRequest.documents.propertyDocuments.urls.length} files)</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedRequest.documents.propertyDocuments.urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                              View {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Input */}
                {selectedRequest.status === 'pending' && (
                  <div className="bg-yellow-50 rounded-2xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reason (if rejecting)</h4>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-black"
                      rows={3}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(selectedRequest.userId)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors duration-200 disabled:opacity-50"
                      >
                        {actionLoading ? 'Rejecting...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest.userId)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl transition-colors duration-200 disabled:opacity-50"
                      >
                        {actionLoading ? 'Approving...' : 'Approve'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}