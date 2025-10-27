# Real-Time Messaging Architecture

## Overview

This document explains the architecture and implementation of real-time messaging using Socket.IO in the Khaya Portal application. The system enables instant message delivery, typing indicators, and live chat updates across multiple users.

## Architecture Components

### 1. Frontend Components

#### **SocketService Class** (`app/lib/socket.ts`)
- **Purpose**: Centralized Socket.IO client management
- **Responsibilities**:
  - Establish WebSocket connection with authentication
  - Handle connection lifecycle (connect, disconnect, errors)
  - Manage chat room subscriptions
  - Provide event listeners for real-time updates

#### **Chat Store** (`app/store/chatStore.ts`)
- **Purpose**: State management for chat data using Zustand
- **Responsibilities**:
  - Manage chat list and current chat state
  - Handle message sending and receiving
  - Process real-time message updates
  - Update chat list with latest messages

#### **Auth Context** (`app/context/AuthContext.tsx`)
- **Purpose**: Authentication state management
- **Responsibilities**:
  - Initialize socket connection on login
  - Disconnect socket on logout
  - Pass authentication token to socket service

### 2. Backend Communication

#### **Socket.IO Server**
- **Protocol**: WebSocket with HTTP fallback (polling)
- **Authentication**: JWT token-based authentication
- **Events**: Custom events for chat functionality

## Real-Time Flow Architecture

### Connection Establishment

```
1. User Login
   ↓
2. AuthContext.login() called
   ↓
3. socketService.connect(token)
   ↓
4. Socket.IO client connects to server
   ↓
5. Server validates JWT token
   ↓
6. Connection established with user context
```

### Chat Room Management

```
1. User selects a chat
   ↓
2. loadChatById() called
   ↓
3. API call to join chat room
   ↓
4. socketService.joinChat(chatId)
   ↓
5. Socket emits 'join_chat' event
   ↓
6. Server adds user to chat room
```

### Message Sending Flow

```
1. User types message
   ↓
2. sendMessage() called
   ↓
3. HTTP POST to /chat/{chatId}/messages
   ↓
4. Server processes message
   ↓
5. Server broadcasts 'new_message' to chat room
   ↓
6. All connected users in room receive message
   ↓
7. Frontend updates UI with new message
```

### Real-Time Message Reception

```
1. Socket receives 'new_message' event
   ↓
2. initSocketListeners() processes event
   ↓
3. Check if message is for current chat
   ↓
4. Add message to current chat messages
   ↓
5. Update chat list with latest message
   ↓
6. UI re-renders with new message
```

## Socket Events

### Client → Server Events

| Event | Purpose | Data |
|-------|---------|------|
| `join_chat` | Join a chat room | `{ chatId: string }` |
| `leave_chat` | Leave a chat room | `{ chatId: string }` |
| `user_typing` | Indicate user is typing | `{ chatId: string, userId: string }` |

### Server → Client Events

| Event | Purpose | Data |
|-------|---------|------|
| `new_message` | New message received | `{ chatId: string, message: Message }` |
| `user_typing` | User typing indicator | `{ chatId: string, userId: string, isTyping: boolean }` |
| `connect` | Connection established | - |
| `disconnect` | Connection lost | - |
| `connect_error` | Connection failed | `{ error: Error }` |

## State Management Flow

### Chat Store State

```typescript
interface ChatState {
  chats: Chat[];           // List of all chats
  currentChat: Chat | null; // Currently selected chat
  messages: Message[];     // Messages in current chat
  isLoading: boolean;      // Loading state
  error: string | null;    // Error state
}
```

### Message Processing

1. **HTTP Messages**: Loaded via REST API on chat selection
2. **Real-time Messages**: Added via Socket.IO events
3. **Duplicate Prevention**: Check message ID before adding
4. **State Updates**: Both current chat and chat list updated

## Authentication Integration

### Token-Based Authentication

```
1. User logs in → JWT token stored in localStorage
2. Socket connection includes token in auth header
3. Server validates token on connection
4. Server associates socket with authenticated user
5. All socket events include user context
```

### Connection Lifecycle

```
Login:
- AuthContext.login() → socketService.connect(token)

Logout:
- AuthContext.logout() → socketService.disconnect()

Chat Selection:
- loadChatById() → socketService.joinChat(chatId)

Chat Deselection:
- clearCurrentChat() → socketService.leaveChat(chatId)
```

## Error Handling

### Connection Errors
- Automatic reconnection attempts
- Fallback to HTTP polling if WebSocket fails
- User notification of connection status

### Message Errors
- HTTP errors for message sending
- Socket errors for real-time updates
- Graceful degradation to manual refresh

## Performance Optimizations

### Message Deduplication
- Check message ID before adding to state
- Prevent duplicate messages from HTTP + Socket

### Room Management
- Join rooms only when needed
- Leave rooms when switching chats
- Clean up listeners on component unmount

### State Updates
- Batch state updates for multiple messages
- Optimistic updates for sent messages
- Efficient chat list updates

## Security Considerations

### Authentication
- JWT token validation on socket connection
- User context verification for all events
- Room-based access control

### Message Privacy
- Private messages with `visibleTo` array
- Role-based message visibility
- Secure message broadcasting

## Scalability Features

### Room-Based Broadcasting
- Messages only sent to chat participants
- Efficient message distribution
- Reduced server load

### Connection Management
- Automatic reconnection
- Connection pooling
- Graceful degradation

## Integration Points

### REST API Integration
- Initial message loading via HTTP
- Message sending via HTTP
- Chat management via HTTP

### Socket.IO Integration
- Real-time message updates
- Typing indicators
- Connection status

### State Management
- Zustand for global state
- React Context for authentication
- Local storage for persistence

## Monitoring and Debugging

### Connection Status
- Console logging for connection events
- Visual indicators for connection state
- Error tracking and reporting

### Message Flow
- Debug logging for message events
- State change tracking
- Performance monitoring

This architecture provides a robust, scalable, and user-friendly real-time messaging system that integrates seamlessly with the existing authentication and state management systems.

