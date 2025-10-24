// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/app/store/chatStore';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function ChatsPage() {
  const { chats, isLoading, error, loadAllChats } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    loadAllChats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading chats</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* iOS-style header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <div className="text-sm text-gray-500 font-medium">
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-center max-w-sm">Conversations between tenants and landlords will appear here.</p>
          </div>
        ) : (
          <div className="bg-white">
            {chats.map((chat, index) => {
              const tenant = chat.participants.find(p => p.role === 'tenant');
              const landlord = chat.participants.find(p => p.role === 'landlord');
              const property = chat.propertyId;

              return (
                <div
                  key={chat._id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                  onClick={() => router.push(`/chats/${chat._id}`)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {tenant?.firstName?.[0] || 'T'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {tenant?.firstName} {tenant?.lastName}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs text-gray-500">with</span>
                        <span className="text-xs font-medium text-gray-700">
                          {landlord?.firstName} {landlord?.lastName}
                        </span>
                        {chat.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>

                      {/* Property info */}
                      {property && (
                        <div className="flex items-center space-x-1 mb-1">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-xs text-gray-500 truncate">
                            {property.title}
                          </span>
                        </div>
                      )}

                      {/* Last message preview */}
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage.content}
                        </p>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {chat.isActive ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}





