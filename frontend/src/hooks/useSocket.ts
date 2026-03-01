import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket.service';
import { SocketEvent, MessageData } from '../types/socket.types';

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<MessageData | null>(null);

    useEffect(() => {
        const socket = socketService.getSocket();

        const handleConnect = () => {
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        const handleMessage = (data: MessageData) => {
            setLastMessage(data);
        };

        socketService.on(SocketEvent.CONNECT, handleConnect);
        socketService.on(SocketEvent.DISCONNECT, handleDisconnect);
        socketService.on(SocketEvent.RECEIVE_MESSAGE, handleMessage);

        // Check initial connection state
        if (socket?.connected) {
            setIsConnected(true);
        }

        return () => {
            socketService.off(SocketEvent.CONNECT, handleConnect);
            socketService.off(SocketEvent.DISCONNECT, handleDisconnect);
            socketService.off(SocketEvent.RECEIVE_MESSAGE, handleMessage);
        };
    }, []);

    const sendMessage = (text: string, userId?: string) => {
        const messageData: MessageData = {
            text,
            userId,
            timestamp: Date.now(),
        };
        socketService.emit(SocketEvent.SEND_MESSAGE, messageData);
    };

    return {
        isConnected,
        lastMessage,
        sendMessage,
        socket: socketService.getSocket(),
    };
};

// Hook để lắng nghe một event cụ thể
export const useSocketEvent = <T = any>(
    event: string,
    handler: (data: T) => void
) => {
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventHandler = (data: T) => {
            handlerRef.current(data);
        };

        socketService.on(event, eventHandler);

        return () => {
            socketService.off(event, eventHandler);
        };
    }, [event]);
};
