// @ts-nocheck
import React from 'react';
import { FaRegSmile } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

export default function GreetingCard() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const { user } = useAuth();
  const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <FaRegSmile className="text-white text-2xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              Good morning, <span className="text-blue-600">{name || 'there'}!</span>
            </h2>
            <p className="text-gray-500 font-medium">{today}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 