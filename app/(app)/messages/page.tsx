// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/app/store/chatStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState(searchParams.get('chat'));
  
  const { 
    chats, 
    currentChat, 
    messages, 
    setMessages,
    loadAllChats, 
    loadChatById, 
    sendMessage, 
    initSocketListeners, 
    clearCurrentChat, 
    isLoading, 
    error 
  } = useChatStore();
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadAllChats();
    initSocketListeners();
  }, []);

  // Sync selectedChatId with URL changes
  useEffect(() => {
    const urlChatId = searchParams.get('chat');
    if (urlChatId !== selectedChatId) {
      setSelectedChatId(urlChatId);
    }
  }, [searchParams, selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      console.log('Loading chat:', selectedChatId);
      setChatLoading(true);
      loadChatById(selectedChatId)
        .then(() => {
          console.log('Chat loaded successfully');
          setChatLoading(false);
        })
        .catch((error) => {
          console.error('Error loading chat:', error);
          setChatLoading(false);
        });
    } else {
      clearCurrentChat();
    }
  }, [selectedChatId, loadChatById, clearCurrentChat]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change or chat loads
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    };

    // Immediate scroll
    scrollToBottom();
    
    // Delayed scroll to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, selectedChatId]);


  const handleChatSelect = (chatId: string) => {
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('chat', chatId);
    window.history.pushState({}, '', url.toString());
    
    // Update the selected chat ID directly
    setSelectedChatId(chatId);
    
    // Close chat list on mobile after selection
    setIsChatListOpen(false);
    
    // Ensure scroll to bottom when chat is selected
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 200);
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending || !selectedChatId) return;
    
    const messageContent = messageText.trim();
    setSending(true);
    setMessageText('');
    
    try {
      await sendMessage(selectedChatId, messageContent);
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showMentionDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMessageText(value);
    setCursorPosition(cursorPos);
    
    // Check if there's already a complete mention in the message
    const hasMention = /@(landlord|tenant)\s/.test(value) || 
                      (/@(landlord|tenant)$/.test(value) && value.length > cursorPos);
    
    // Only show dropdown if there's no existing mention
    if (!hasMention) {
      // Check if user typed @ and show mention dropdown
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
        
        // Check if there's a space after the @ (which means they finished typing)
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          setMentionSearchTerm(textAfterAt.toLowerCase());
          setShowMentionDropdown(true);
        } else {
          setShowMentionDropdown(false);
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (role: string) => {
    // Check if there's already a mention
    const hasMention = /@(landlord|tenant)/.test(messageText);
    if (hasMention) {
      setShowMentionDropdown(false);
      return;
    }
    
    const textBeforeCursor = messageText.substring(0, cursorPosition);
    const textAfterCursor = messageText.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const newText = 
        messageText.substring(0, lastAtSymbol) + 
        `@${role} ` + 
        textAfterCursor;
      
      setMessageText(newText);
      setShowMentionDropdown(false);
      
      // Focus back on textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = lastAtSymbol + role.length + 2;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const insertTag = (tag: string) => {
    const currentText = messageText.trim();
    setMessageText(currentText ? `${currentText} ${tag} ` : `${tag} `);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Filter mentions based on search term
  const availableMentions = [
    { role: 'landlord', label: 'Landlord', icon: '🏠' },
    { role: 'tenant', label: 'Tenant', icon: '👤' }
  ].filter(mention => 
    mention.role.toLowerCase().includes(mentionSearchTerm) || 
    mention.label.toLowerCase().includes(mentionSearchTerm)
  );

  // Only show full page loading for initial data load, not for chat switching
  if (isLoading && chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="font-semibold text-red-700 mb-2">Error loading messages</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
      <style jsx global>{`
        /* Hide scrollbar for all elements */
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        *::-webkit-scrollbar {
          display: none !important;
        }
        
        /* Custom scrollbar for messages */
        .messages-scrollbar::-webkit-scrollbar {
          width: 8px;
          display: block !important;
        }
        .messages-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .messages-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .messages-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .messages-scrollbar {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          /* Force scrollbar to always be visible */
          overflow-y: scroll !important;
        }
        
        /* Custom scrollbar for chat list */
        .chat-list-scrollbar::-webkit-scrollbar {
          width: 6px;
          display: block !important;
        }
        .chat-list-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        .chat-list-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .chat-list-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .chat-list-scrollbar {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 #f8fafc;
        }
      `}</style>
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Chat List Sidebar - Completely Independent */}
        <div className={`
          ${isChatListOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative
          w-80 md:w-1/3 md:min-w-80 md:max-w-96
          bg-white border-r border-gray-200 flex flex-col h-full
          z-50 md:z-auto
          transition-transform duration-300 ease-in-out
        `}>
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500 font-medium">
                  {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
                </div>
                {/* Mobile close button */}
                <button
                  onClick={() => setIsChatListOpen(false)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Chat List - Dedicated Scroll Container */}
          <div 
            className="flex-1 overflow-y-auto chat-list-scrollbar" 
            style={{ 
              height: 'calc(100vh - 160px)',
              maxHeight: 'calc(100vh - 160px)',
              overflowY: 'auto'
            }}
          >
            {isLoading && chats.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 text-center max-w-sm">Conversations between tenants and landlords will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {chats.map((chat) => {
                  const tenant = chat.participants.find(p => p.role === 'tenant');
                  const landlord = chat.participants.find(p => p.role === 'landlord');
                  const property = chat.propertyId;
                  const isSelected = selectedChatId === chat._id;

                  return (
                    <div
                      key={chat._id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                      onClick={() => handleChatSelect(chat._id)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {tenant?.firstName?.[0] || 'T'}
                          </div>
                          {chat.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate" style={{ color: '#111827' }}>
                              {tenant?.firstName} {tenant?.lastName}
                            </h3>
                            <span className="text-xs text-gray-500 font-medium" style={{ color: '#6b7280' }}>
                              {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs" style={{ color: '#6b7280' }}>with</span>
                            <span className="text-xs font-medium" style={{ color: '#374151' }}>
                              {landlord?.firstName} {landlord?.lastName}
                            </span>
                          </div>

                          {/* Property info */}
                          {property && (
                            <div className="flex items-center space-x-1 mb-1">
                              <svg className="w-3 h-3" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                              </svg>
                              <span className="text-xs truncate" style={{ color: '#6b7280' }}>
                                {property.title}
                              </span>
                            </div>
                          )}

                          {/* Last message preview */}
                          {chat.lastMessage && (
                            <p className="text-sm truncate" style={{ color: '#4b5563' }}>
                              {chat.lastMessage.content}
                            </p>
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

        {/* Mobile Overlay */}
        {isChatListOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsChatListOpen(false)}
          />
        )}

        {/* Messages Area - Completely Independent */}
        <div className="flex-1 flex flex-col bg-gray-50 h-full min-h-0 lg:flex-1">
          {selectedChatId ? (
            chatLoading ? (
              /* Chat Loading State - Only in chat area */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading conversation...</p>
                </div>
              </div>
            ) : currentChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    {/* Mobile menu button */}
                    <button
                      onClick={() => setIsChatListOpen(true)}
                      className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    
                    <div className="flex-1">
                      <h1 className="text-lg font-semibold text-gray-900">
                        {currentChat.participants.find(p => p.role === 'tenant')?.firstName} {currentChat.participants.find(p => p.role === 'tenant')?.lastName}
                      </h1>
                      {currentChat.propertyId && (
                        <p className="text-sm text-gray-500 truncate">
                          {currentChat.propertyId.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-xs">
                        {currentChat.participants.find(p => p.role === 'landlord')?.firstName?.[0] || 'L'}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {currentChat.participants.find(p => p.role === 'landlord')?.firstName} {currentChat.participants.find(p => p.role === 'landlord')?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Landlord</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages - Dedicated Scroll Container */}
                <div 
                  className="flex-1 overflow-y-auto bg-gray-50 messages-scrollbar" 
                  style={{ 
                    height: 'calc(100vh - 320px)',
                    maxHeight: 'calc(100vh - 320px)',
                    overflowY: 'auto',
                    position: 'relative',
                    minHeight: '250px'
                  }}
                >
                  <div className="px-4 py-6 space-y-3">
                    
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                        <p className="text-xs text-gray-400 mt-2">Chat ID: {selectedChatId}</p>
                        
                        {/* Manual test buttons */}
                        <div className="mt-4 space-x-2">
                          {selectedChatId && (
                            <button
                              onClick={() => {
                                console.log('Manually loading chat:', selectedChatId);
                                loadChatById(selectedChatId);
                              }}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                            >
                              Load Chat Manually
                            </button>
                          )}
                          <button
                            onClick={() => {
                              console.log('Current state:', { messages, currentChat, selectedChatId });
                              console.log('Store state:', { chats, isLoading, error });
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                          >
                            Log State
                          </button>
                        </div>
                        
                        {/* Sample messages to show interface */}
                        <div className="mt-8 space-y-4 w-full max-w-md">
                          <div className="text-sm text-gray-400 mb-4">Sample conversation:</div>
                          
                          {/* Sample incoming message */}
                          <div className="flex justify-start">
                            <div className="max-w-xs bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200">
                              <p className="text-sm text-gray-900">Hello! How can I help you today?</p>
                              <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                            </div>
                          </div>
                          
                          {/* Sample outgoing message */}
                          <div className="flex justify-end">
                            <div className="max-w-xs bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3">
                              <p className="text-sm">Hi there! I have a question about my property.</p>
                              <p className="text-xs text-blue-100 mt-1">1 minute ago</p>
                            </div>
                          </div>
                          
                          {/* Sample incoming message */}
                          <div className="flex justify-start">
                            <div className="max-w-xs bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200">
                              <p className="text-sm text-gray-900">Of course! What would you like to know?</p>
                              <p className="text-xs text-gray-500 mt-1">Just now</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        // Determine if message is from current user (landlord/admin)
                        // Messages from tenant should always be on the left (justify-start)
                        // Messages from landlord/admin should be on the right (justify-end)
                        const isFromCurrentUser = msg.senderRole === 'landlord' || msg.senderRole === 'admin';
                        
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs sm:max-w-md ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                              {msg.isPrivate && (
                                <div className="flex items-center gap-1 text-xs text-orange-600 mb-1 px-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span>Private message to {msg.taggedUser}</span>
                                </div>
                              )}
                              <div
                                className={`px-4 py-3 rounded-2xl ${
                                  isFromCurrentUser
                                    ? 'bg-blue-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                                }`}
                                style={{
                                  boxShadow: isFromCurrentUser 
                                    ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
                                    : '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {msg.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className={`text-xs ${
                                    isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                  </p>
                                  
                                  {/* Status icon for sent messages */}
                                  {isFromCurrentUser && (
                                    <div className="ml-2">
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input - Fixed at bottom */}
                <div className="bg-white border-t border-gray-200 flex-shrink-0 sticky bottom-0 z-10">
                  <div className="px-4 py-3">
                    {/* Quick actions */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => insertTag('@landlord')}
                        className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors font-medium border border-green-200"
                      >
                        @ Landlord
                      </button>
                      <button
                        onClick={() => insertTag('@tenant')}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                      >
                        @ Tenant
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-gray-400 flex items-center">
                        Type @ to mention
                      </span>
                    </div>
                    
                    <div className="flex items-end space-x-3 relative">
                      {/* Mention Dropdown */}
                      {showMentionDropdown && availableMentions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl overflow-hidden z-50 min-w-[240px] border border-gray-200">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-600">
                              💬 Private Message
                            </p>
                          </div>
                          <div className="max-h-[160px] overflow-y-auto">
                            {availableMentions.map((mention, index) => (
                              <button
                                key={mention.role}
                                onClick={() => insertMention(mention.role)}
                                className="w-full px-4 py-3 text-left transition-colors flex items-center gap-3 hover:bg-gray-50"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                  index === 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {mention.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {mention.label}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    @{mention.role}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 relative">
                        <div className="bg-gray-100 rounded-3xl px-4 py-3 min-h-[44px] flex items-center">
                          <textarea
                            ref={textareaRef}
                            value={messageText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Message"
                            className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder-gray-500"
                            style={{
                              caretColor: '#007AFF',
                            }}
                            rows={1}
                            disabled={sending}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSend}
                        disabled={sending || !messageText.trim()}
                        className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {sending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Chat Error State */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading chat</h3>
                  <p className="text-gray-500">Unable to load this conversation</p>
                </div>
              </div>
            )
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Mobile header for empty state */}
              <div className="md:hidden bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsChatListOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                  {/* Mobile button to open chat list */}
                  <button
                    onClick={() => setIsChatListOpen(true)}
                    className="mt-4 md:hidden px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Browse Conversations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
