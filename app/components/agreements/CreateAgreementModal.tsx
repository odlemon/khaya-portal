// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAgreementsService } from '@/app/services/agreements/agreements.service';
import { useAuth } from '@/app/context/AuthContext';

export type CreateAgreementPreset = {
  landlordId: string;
  tenantId: string;
  propertyId: string;
  landlordName?: string;
  tenantName?: string;
  propertyTitle?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When set (from chat), lock landlord/tenant/property */
  preset?: CreateAgreementPreset;
};

const emptyForm = {
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
};

export default function CreateAgreementModal({ open, onClose, onSuccess, preset }: Props) {
  const locked = Boolean(preset);
  const [formData, setFormData] = useState(emptyForm);
  const [connectedParties, setConnectedParties] = useState<any>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createAgreement, getConnectedParties } = useAgreementsService();
  const { loading: authLoading } = useAuth();

  const resetForm = useCallback(() => {
    if (preset) {
      setFormData({
        ...emptyForm,
        landlordId: preset.landlordId,
        tenantId: preset.tenantId,
        propertyId: preset.propertyId,
      });
    } else {
      setFormData(emptyForm);
    }
    setSelectedLandlord(null);
    setSelectedProperty(null);
    setAvailableTenants([]);
    setError(null);
  }, [preset]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || authLoading || locked) return;

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

    fetchConnectedParties();
  }, [open, authLoading, locked, getConnectedParties]);

  useEffect(() => {
    if (locked || !formData.landlordId || !connectedParties?.data?.landlords) {
      if (!locked) setSelectedLandlord(null);
      return;
    }
    const landlord = connectedParties.data.landlords.find((l: any) => l.id === formData.landlordId);
    setSelectedLandlord(landlord || null);
  }, [formData.landlordId, connectedParties, locked]);

  useEffect(() => {
    if (locked) return;

    if (formData.propertyId && selectedLandlord) {
      const property = selectedLandlord.properties.find((p: any) => p.id === formData.propertyId);
      setSelectedProperty(property || null);
      if (property && property.tenants && property.tenants.length > 0) {
        setAvailableTenants(property.tenants);
        if (property.tenants.length === 1) {
          setFormData((prev) => ({ ...prev, tenantId: property.tenants[0].id }));
        } else if (!formData.tenantId || !property.tenants.find((t: any) => t.id === formData.tenantId)) {
          setFormData((prev) => ({ ...prev, tenantId: property.tenants[0].id }));
        }
      } else {
        setAvailableTenants([]);
        setFormData((prev) => ({ ...prev, tenantId: '' }));
      }
    } else {
      setSelectedProperty(null);
      setAvailableTenants([]);
      if (!formData.propertyId) {
        setFormData((prev) => ({ ...prev, tenantId: '' }));
      }
    }
  }, [formData.propertyId, selectedLandlord, locked]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateAgreement = async () => {
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

    if (!locked) {
      if (!formData.tenantId) {
        setError('No tenant found for the selected property. Please ensure the property has a connected tenant.');
        return;
      }
      if (selectedProperty && !selectedProperty.tenants.find((t: any) => t.id === formData.tenantId)) {
        setError('Selected tenant is not connected to the selected property');
        return;
      }
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

      if (formData.terms.length > 0) {
        agreementPayload.terms = formData.terms;
      }

      if (formData.specialConditions.length > 0) {
        agreementPayload.specialConditions = formData.specialConditions;
      }

      const response = await createAgreement(agreementPayload);

      if (response?.success) {
        resetForm();
        onClose();
        onSuccess?.();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
        <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Create New Agreement</h2>
              <p className="text-sm text-gray-500 mt-1">
                {locked
                  ? 'Parties are set from this chat — fill in the remaining details'
                  : 'Fill in the details to create a new rental agreement'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-300/50 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(98vh-180px)] sm:max-h-[calc(95vh-180px)]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Rental Agreement for 2BR Apartment"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Agreement description..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                  />
                </div>
              </div>
            </div>

            {locked && preset ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parties (from chat)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Landlord</p>
                    <p className="text-sm font-medium text-gray-900">{preset.landlordName || 'Landlord'}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Tenant</p>
                    <p className="text-sm font-medium text-gray-900">{preset.tenantName || 'Tenant'}</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Property</p>
                    <p className="text-sm font-medium text-gray-900">{preset.propertyTitle || 'Property'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                          setFormData((prev) => ({
                            ...prev,
                            landlordId: e.target.value,
                            propertyId: '',
                            tenantId: '',
                          }));
                          setSelectedLandlord(null);
                          setSelectedProperty(null);
                          setAvailableTenants([]);
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      >
                        <option value="">Select Landlord</option>
                        {connectedParties.data.landlords.map((landlord: any) => (
                          <option key={landlord.id} value={landlord.id}>
                            {landlord.fullName} ({landlord.email}) - {landlord.properties?.length || 0}{' '}
                            properties
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {formData.propertyId && selectedProperty && availableTenants.length > 0 && formData.tenantId && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm font-medium text-blue-900 mb-1">Selected Tenant:</p>
                      <p className="text-sm text-blue-700">
                        {availableTenants.find((t: any) => t.id === formData.tenantId)?.fullName ||
                          'Auto-selected from property connection'}
                        {availableTenants.find((t: any) => t.id === formData.tenantId) && (
                          <span className="text-blue-600">
                            {' '}
                            ({availableTenants.find((t: any) => t.id === formData.tenantId)?.email})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

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
                    ) : !selectedLandlord ||
                      !selectedLandlord.properties ||
                      selectedLandlord.properties.length === 0 ? (
                      <div className="px-4 py-2.5 border border-gray-300 rounded-xl bg-yellow-50">
                        <p className="text-sm text-yellow-700">
                          No properties with connected tenants found for selected landlord
                        </p>
                      </div>
                    ) : (
                      <select
                        value={formData.propertyId}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            propertyId: e.target.value,
                            tenantId: '',
                          }));
                          setSelectedProperty(null);
                          setAvailableTenants([]);
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        required
                      >
                        <option value="">Select Property</option>
                        {selectedLandlord.properties.map((property: any) => (
                          <option key={property.id} value={property.id}>
                            {property.title} - {property.address.street}, {property.address.city} (
                            {property.tenants?.length || 0} connected tenants)
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedProperty && selectedProperty.tenants && selectedProperty.tenants.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedProperty.tenants.length} tenant
                        {selectedProperty.tenants.length !== 1 ? 's' : ''} connected to this property
                        {selectedProperty.tenants.length === 1 && formData.tenantId && (
                          <span className="text-green-600 ml-2">✓ Tenant auto-selected</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

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
                    onChange={(e) => setFormData((prev) => ({ ...prev, rentAmount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount</label>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, depositAmount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={formData.zeroDeposit}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.zeroDeposit}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        zeroDeposit: e.target.checked,
                        depositAmount: e.target.checked ? '0' : prev.depositAmount,
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Frequency</label>
                  <select
                    value={formData.paymentFrequency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentFrequency: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, paymentDueDay: e.target.value }))}
                    min="1"
                    max="31"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Late Fee Amount</label>
                  <input
                    type="number"
                    value={formData.lateFee}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lateFee: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (days)</label>
                  <input
                    type="number"
                    value={formData.gracePeriod}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gracePeriod: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.utilitiesIncluded}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, utilitiesIncluded: e.target.checked }))
                    }
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
                        const list = e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter((item) => item);
                        setFormData((prev) => ({ ...prev, utilitiesList: list }));
                      }}
                      placeholder="Water, Electricity, Internet"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceIncluded}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maintenanceIncluded: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Maintenance Included</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms (one per line)</label>
                  <textarea
                    value={formData.terms.join('\n')}
                    onChange={(e) => {
                      const terms = e.target.value
                        .split('\n')
                        .map((item) => item.trim())
                        .filter((item) => item);
                      setFormData((prev) => ({ ...prev, terms }));
                    }}
                    placeholder="Enter terms, one per line..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Conditions (one per line)
                  </label>
                  <textarea
                    value={formData.specialConditions.join('\n')}
                    onChange={(e) => {
                      const conditions = e.target.value
                        .split('\n')
                        .map((item) => item.trim())
                        .filter((item) => item);
                      setFormData((prev) => ({ ...prev, specialConditions: conditions }));
                    }}
                    placeholder="Enter special conditions, one per line..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
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
  );
}
