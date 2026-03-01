# WebSocket Configuration Guide

## 📋 Tổng quan

Dự án đã được cấu hình WebSocket sử dụng Socket.IO cho cả Frontend (React) và Backend (NestJS).

## 🏗️ Kiến trúc

### Backend (NestJS)
- **File chính:** `server/src/events/events.gateway.ts`
- **Port:** 3001 (cùng port với REST API)
- **Transport:** WebSocket
- **CORS:** Cho phép origin từ `http://localhost:3000`

### Frontend (React)
- **Service:** `frontend/src/services/socket.service.ts`
- **Hook:** `frontend/src/hooks/useSocket.ts`
- **Types:** `frontend/src/types/socket.types.ts`
- **Demo Component:** `frontend/src/components/WebSocketDemo/`

## 🚀 Cách sử dụng

### 1. Backend

Gateway đã được tự động import vào `AppModule`. Không cần cấu hình thêm.

#### Các features có sẵn:

- ✅ Connection tracking
- ✅ Data validation
- ✅ Error handling
- ✅ Logger integration
- ✅ Broadcast messages
- ✅ Send to specific client

#### Helper methods:

```typescript
// Broadcast to all clients
this.eventsGateway.broadcastToAll('notification', data);

// Send to specific client
this.eventsGateway.sendToClient(clientId, 'private-message', data);
```

### 2. Frontend

#### Cách 1: Sử dụng Hook (Khuyến nghị)

```typescript
import { useSocket } from './hooks/useSocket';

function MyComponent() {
    const { isConnected, lastMessage, sendMessage } = useSocket();

    const handleSend = () => {
        sendMessage('Hello from React!');
    };

    return (
        <div>
            <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
            <button onClick={handleSend}>Send Message</button>
        </div>
    );
}
```

#### Cách 2: Sử dụng trực tiếp socketService

```typescript
import { socketService } from './services/socket.service';

// Kết nối
socketService.connect();

// Lắng nghe event
socketService.on('receive-message', (data) => {
    console.log('Received:', data);
});

// Gửi message
socketService.emit('send-message', { text: 'Hello' });

// Ngắt kết nối
socketService.disconnect();
```

#### Cách 3: Sử dụng useSocketEvent hook cho custom events

```typescript
import { useSocketEvent } from './hooks/useSocket';

function MyComponent() {
    useSocketEvent('notification', (data) => {
        console.log('Notification received:', data);
    });

    return <div>Component content</div>;
}
```

## 🎨 Demo Component

Để test WebSocket, sử dụng component `WebSocketDemo`:

```typescript
import WebSocketDemo from './components/WebSocketDemo';

function TestPage() {
    return <WebSocketDemo />;
}
```

## 📝 Events có sẵn

### Client → Server
- `send-message`: Gửi message đến server

### Server → Client
- `receive-message`: Nhận message từ clients khác
- `welcome`: Message chào mừng khi kết nối thành công

### Connection Events (Auto-handled)
- `connect`: Khi kết nối thành công
- `disconnect`: Khi mất kết nối
- `connect_error`: Lỗi khi kết nối
- `reconnect`: Khi reconnect thành công
- `reconnect_error`: Lỗi khi reconnect
- `reconnect_failed`: Reconnect thất bại

## ⚙️ Cấu hình

### Frontend (.env)
```env
REACT_APP_SOCKET_URL=http://localhost:3001
```

### Backend
CORS và các cấu hình WebSocket được định nghĩa trong `events.gateway.ts`:

```typescript
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    transports: ['websocket'],
})
```

## 🔒 Security (TODO)

Hiện tại authentication chưa được implement. Để thêm authentication:

1. Uncomment code trong `handleConnection` ở `events.gateway.ts`
2. Gửi token từ frontend khi connect:

```typescript
socketService.connect();
const socket = socketService.getSocket();
if (socket) {
    socket.auth = { token: 'your-jwt-token' };
    socket.connect();
}
```

## 🐛 Debug

### Client logs:
- ✅ `Connected: [socket-id]`
- ⚠️ `Connection error: [error]`
- 🔄 `Reconnected after [n] attempts`
- ❌ `Reconnection failed`

### Server logs:
- ✅ `Client connected: [id] (Total: [count])`
- ❌ `Client disconnected: [id] (Total: [count])`
- 📩 `Message from [id]: [text]`

## 🎯 Best Practices

1. **Luôn cleanup listeners** khi component unmount
2. **Sử dụng hooks** thay vì trực tiếp với socketService
3. **Validate data** trước khi emit
4. **Handle errors** properly
5. **Check connection status** trước khi emit

## 📚 Tài liệu tham khảo

- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
