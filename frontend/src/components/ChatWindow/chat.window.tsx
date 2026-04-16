import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faImage, faPaperclip, faPaperPlane, faSmile, faInfoCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import styles from './chat.window.module.scss';
import MessageItem from './MessageItem';
import conversationService from '../../services/conversation.service';
import messageService from '../../services/message.service';
import authService from '../../services/auth.service';
import { Message } from '../../types/message.types';
import { socketService } from '../../services/socket.service';
import { ConversationMessageDeletedPayload, ConversationOnlineCountPayload, SocketEvent } from '../../types/socket.types';
import { resolveImageSrc } from '../../utils/image-url';

interface Conversation {
  _id: string;
  title: string;
  participantsCount: number;
  lastMessageUserName?: string;
  activityId?: {
    _id?: string;
    title?: string;
    image?: string;
  };
}

const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('Id');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id ? String(currentUser.id) : null;
  const latestMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
  const previousMessageCountRef = useRef(0);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToLatestMessage = (behavior: ScrollBehavior = 'smooth') => {
    latestMessageRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  const triggerNewMessageFeedback = (messageId: string) => {
    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId((currentValue) => currentValue === messageId ? null : currentValue);
      highlightTimeoutRef.current = null;
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  useEffect(() => {
    previousMessageCountRef.current = 0;
    setHighlightedMessageId(null);
    setOnlineCount(0);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) {
      setError('Không tìm thấy ID cuộc trò chuyện');
      setLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        setLoading(true);
        const [conversationResponse, messageResponse] = await Promise.all([
          conversationService.getById(conversationId),
          messageService.getConversationMessages(conversationId),
        ]);

        setConversation(conversationResponse.data.data);
        setMessages([...messageResponse].reverse());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tải cuộc trò chuyện');
        setConversation(null);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    if (messages.length === 0) {
      previousMessageCountRef.current = 0;
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessage = messages.length > previousMessageCount;
    const latestMessage = messages[messages.length - 1];

    if (previousMessageCount === 0) {
      scrollToLatestMessage('auto');
    } else if (hasNewMessage && latestMessage) {
      scrollToLatestMessage('smooth');
      triggerNewMessageFeedback(latestMessage._id);
    }

    previousMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const socket = socketService.connect();

    const joinConversation = () => {
      socketService.emit(SocketEvent.JOIN_CONVERSATION, { conversationId });
    };

    const handleRealtimeMessage = (incomingMessage: Message) => {
      if (String(incomingMessage.conversationId) !== conversationId) {
        return;
      }

      const normalizedRealtimeMessage: Message = {
        ...incomingMessage,
        messageType: incomingMessage.messageType
          || (incomingMessage.imageUrl ? 'image' : 'text'),
      };

      setMessages((prevMessages) => {
        if (prevMessages.some((message) => message._id === normalizedRealtimeMessage._id)) {
          return prevMessages;
        }

        return [...prevMessages, normalizedRealtimeMessage];
      });

      setConversation((prevConversation) => prevConversation ? {
        ...prevConversation,
        lastMessageUserName: normalizedRealtimeMessage.senderName,
      } : prevConversation);
    };

    const handleOnlineCount = (payload: ConversationOnlineCountPayload) => {
      if (payload.conversationId !== conversationId) {
        return;
      }

      setOnlineCount(payload.onlineCount);
    };

    const handleMessageDeleted = (payload: ConversationMessageDeletedPayload) => {
      if (payload.conversationId !== conversationId) {
        return;
      }

      setMessages((currentMessages) => currentMessages.map((message) => message._id === payload.messageId
        ? {
          ...message,
          content: payload.content || 'Tin nhắn đã bị thu hồi',
          isDeleted: true,
          deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : new Date(),
        }
        : message));
    };

    socketService.on(SocketEvent.CONVERSATION_MESSAGE_NEW, handleRealtimeMessage);
    socketService.on(SocketEvent.CONVERSATION_MESSAGE_DELETED, handleMessageDeleted);
    socketService.on(SocketEvent.CONVERSATION_ONLINE_COUNT, handleOnlineCount);

    if (socket.connected) {
      joinConversation();
    } else {
      socket.once(SocketEvent.CONNECT, joinConversation);
    }

    return () => {
      socket.off(SocketEvent.CONNECT, joinConversation);
      socketService.emit(SocketEvent.LEAVE_CONVERSATION, { conversationId });
      socketService.off(SocketEvent.CONVERSATION_MESSAGE_NEW, handleRealtimeMessage);
      socketService.off(SocketEvent.CONVERSATION_MESSAGE_DELETED, handleMessageDeleted);
      socketService.off(SocketEvent.CONVERSATION_ONLINE_COUNT, handleOnlineCount);
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    const hasImage = Boolean(selectedImageFile);

    if (!conversationId || (!trimmedMessage && !hasImage) || isSending || !currentUser?.id) {
      return;
    }

    try {
      setIsSending(true);
      setSendError(null);

      let messageContent = trimmedMessage;
      let messageType: 'text' | 'image' = 'text';
      let imageUrl: string | undefined;

      if (selectedImageFile) {
        const uploadResult = await messageService.uploadImage(selectedImageFile);
        imageUrl = uploadResult.imageUrl;
        messageType = 'image';
        messageContent = trimmedMessage || 'Đã gửi một hình ảnh';
      }

      const createdMessage = await messageService.createMessage({
        conversationId,
        content: messageContent,
        imageUrl,
        messageType,
        senderAvatar: currentUser.avatar || undefined,
      });

      setMessages((prevMessages) => {
        if (prevMessages.some((message) => message._id === createdMessage._id)) {
          return prevMessages;
        }

        return [...prevMessages, createdMessage];
      });

      setConversation((prevConversation) => prevConversation ? {
        ...prevConversation,
        lastMessageUserName: currentUser.name,
      } : prevConversation);
      setNewMessage('');
      setSelectedImageFile(null);
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
      setSelectedImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Lỗi khi gửi tin nhắn');
    } finally {
      setIsSending(false);
    }
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSendError('Vui lòng chọn file hình ảnh hợp lệ');
      event.target.value = '';
      return;
    }

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    setSendError(null);
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa tin nhắn này không?');

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMessageId(messageId);
      const response = await messageService.deleteMessage(messageId);
      const revokedMessage = response?.message;

      setMessages((currentMessages) => currentMessages.map((message) => message._id === messageId
        ? {
          ...message,
          content: revokedMessage?.content || 'Tin nhắn đã bị thu hồi',
          isDeleted: true,
          deletedAt: revokedMessage?.deletedAt ? new Date(revokedMessage.deletedAt) : new Date(),
        }
        : message));
      setHighlightedMessageId((currentValue) => currentValue === messageId ? null : currentValue);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa tin nhắn';
      window.alert(errorMessage);
    } finally {
      setDeletingMessageId((currentValue) => currentValue === messageId ? null : currentValue);
    }
  };

  const handleInputKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSendMessage();
    }
  };

  if (loading) {
    return (
      <main className={styles.chatWindow}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p>Đang tải...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.chatWindow}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className={styles.chatWindow}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p>Không tìm thấy cuộc trò chuyện</p>
        </div>
      </main>
    );
  }

  const activityImageUrl = resolveImageSrc(conversation?.activityId?.image);

  return (
    <main className={styles.chatWindow}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.mobileBackButton}
            onClick={() => navigate('/chat')}
            aria-label="Quay lại danh sách cuộc trò chuyện"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className={styles.conversationAvatar} aria-label={conversation.activityId?.title || conversation.title}>
            {activityImageUrl ? (
              <img src={activityImageUrl} alt={conversation.activityId?.title || conversation.title} />
            ) : (
              <i className="fa-solid fa-building"></i>
            )}
          </div>
          <div className={styles.titleInfo}>
            <h3>{conversation.title}</h3>
            <span>{conversation.participantsCount} Thành viên • <span className={styles.online}>{onlineCount} online</span></span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button><FontAwesomeIcon icon={faUsers} /></button>
          <button><FontAwesomeIcon icon={faInfoCircle} /></button>
        </div>
      </header>

      {/* Message Area */}
      <div className={styles.messageArea}>
        {messages.length === 0 ? (
          <div className={styles.dateSeparator}><span>Chưa có tin nhắn nào</span></div>
        ) : (
          messages.map((message) => {
            const isSent = String(message.senderId) === currentUserId;

            return (
              <div
                key={message._id}
                ref={message._id === latestMessageId ? latestMessageRef : null}
                className={`${styles.messageItemWrapper} ${isSent ? styles.sent : ''}`}
              >
                <MessageItem
                  avatar={message.senderAvatar}
                  senderName={message.senderName}
                  content={message.content}
                  imageUrl={message.imageUrl}
                  messageType={message.messageType}
                  time={new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  isSent={isSent}
                  isNew={message._id === highlightedMessageId}
                  isDeleted={Boolean(message.isDeleted)}
                  onDelete={isSent && !message.isDeleted && deletingMessageId !== message._id ? () => handleDeleteMessage(message._id) : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <footer className={styles.inputArea}>
        {sendError && <div className={styles.sendError}>{sendError}</div>}
        {selectedImagePreview && (
          <div className={styles.imagePreviewBox}>
            <img src={selectedImagePreview} alt="Ảnh sắp gửi" className={styles.imagePreview} />
            <button type="button" onClick={handleRemoveSelectedImage} className={styles.removePreviewBtn}>
              Bỏ ảnh
            </button>
          </div>
        )}
        <div className={styles.tools}>
          <button type="button"><FontAwesomeIcon icon={faPlus} /></button>
          <label htmlFor="chat-image-input" className={styles.imageToolBtn} aria-label="Chọn hình ảnh">
            <FontAwesomeIcon icon={faImage} />
          </label>
          <button type="button"><FontAwesomeIcon icon={faPaperclip} /></button>
          <input
            id="chat-image-input"
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenImageInput}
            onChange={handleImageFileChange}
          />
        </div>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(event) => {
              setNewMessage(event.target.value);
              if (sendError) {
                setSendError(null);
              }
            }}
            onKeyDown={handleInputKeyDown}
            disabled={isSending}
          />
          <FontAwesomeIcon icon={faSmile} className={styles.emoji} />
        </div>
        <button
          className={styles.sendBtn}
          onClick={handleSendMessage}
          disabled={isSending || (!newMessage.trim() && !selectedImageFile)}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </footer>
    </main>
  );
};

export default ChatWindow;