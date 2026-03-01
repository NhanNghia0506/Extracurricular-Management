export interface MessageData {
    text: string;
    userId?: string;
    timestamp?: number;
}

export interface WelcomeData {
    message: string;
    clientId: string;
}

export interface MessageResponse {
    status: 'ok' | 'error';
    message: string;
    data?: MessageData;
}

// Socket Events
export enum SocketEvent {
    // Client to Server
    SEND_MESSAGE = 'send-message',

    // Server to Client
    RECEIVE_MESSAGE = 'receive-message',
    WELCOME = 'welcome',

    // Connection events
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    CONNECT_ERROR = 'connect_error',
    RECONNECT = 'reconnect',
    RECONNECT_ERROR = 'reconnect_error',
    RECONNECT_FAILED = 'reconnect_failed',
}
