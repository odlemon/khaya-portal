// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/app/store/chatStore';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  
  const { currentChat, messages, loadChatById, sendMessage, initSocketListeners, clearCurrentChat, isLoading, error } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initSocketListeners();
    loadChatById(chatId);

    return () => {
      clearCurrentChat();
    };
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(chatId, messageText);
      setMessageText('');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="font-semibold text-red-700 mb-2">Error loading chat</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/chats')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentChat) {
    return null;
  }

  const tenant = currentChat.participants.find(p => p.role === 'tenant');
  const landlord = currentChat.participants.find(p => p.role === 'landlord');
  const property = currentChat.propertyId;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* iOS-style header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/chats')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {tenant?.firstName} {tenant?.lastName}
              </h1>
              {property && (
                <p className="text-sm text-gray-500 truncate">
                  {property.title}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-xs">
                {landlord?.firstName?.[0] || 'L'}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {landlord?.firstName} {landlord?.lastName}
                </p>
                <p className="text-xs text-gray-500">Landlord</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="px-4 py-6 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs sm:max-w-md ${msg.isMine ? 'order-2' : 'order-1'}`}>
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
                      msg.isMine
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : msg.senderRole === 'admin'
                        ? 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                        : msg.senderRole === 'tenant'
                        ? 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                    }`}
                    style={{
                      boxShadow: msg.isMine 
                        ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
                        : '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      msg.isMine ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* iOS-style Input */}
      <div className="bg-white border-t border-gray-200">
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
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-black placeholder-gray-500"
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
    </div>
  );
}

