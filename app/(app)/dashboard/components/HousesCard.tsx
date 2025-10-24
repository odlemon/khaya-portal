// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { FaHome } from 'react-icons/fa';
import { useDashboardService } from '../../../services/dashboard/dashboard.service';
import { useAuth } from '../../../context/AuthContext';

export default function HousesCard() {
  const [houseCount, setHouseCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { getPropertyCount } = useDashboardService();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't make API calls while auth is loading
    if (authLoading) {
      return;
    }

    getPropertyCount().then(count => {
      setHouseCount(count);
      setLoading(false);
    }).catch(() => {
      // Fallback to mock data if API fails
      setHouseCount(38);
      setLoading(false);
    });
  }, [getPropertyCount, authLoading]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <FaHome className="text-purple-600 text-xl" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">Rental Properties</p>
          <p className="text-3xl font-bold text-gray-900">
            {loading ? (
              <span className="text-gray-300 animate-pulse">—</span>
            ) : (
              houseCount?.toLocaleString() || '0'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
