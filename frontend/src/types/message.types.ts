export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    status: 'sending' | 'sent' | 'delivered' | 'read';
    messageType: 'text' | 'image' | 'file';
    reactions: string[];
    editHistory: EditHistory[];
    createdAt: Date;
    updatedAt: Date;
}

export interface EditHistory {
    content: string;
    editedAt: Date;
}

export interface CreateMessagePayload {
    conversationId: string;
    content: string;
    messageType?: 'text' | 'image' | 'file';
    senderAvatar?: string;
}

export interface UpdateMessagePayload {
    content?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    reactions?: string[];
}
