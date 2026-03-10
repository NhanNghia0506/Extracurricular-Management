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
import { ConversationOnlineCountPayload, SocketEvent } from '../../types/socket.types';

interface Conversation {
  _id: string;
  title: string;
  participantsCount: number;
  lastMessageUserName?: string;
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
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id ? String(currentUser.id) : null;
  const latestMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
  const previousMessageCountRef = useRef(0);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

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
    };
  }, []);

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

      setMessages((prevMessages) => {
        if (prevMessages.some((message) => message._id === incomingMessage._id)) {
          return prevMessages;
        }

        return [...prevMessages, incomingMessage];
      });

      setConversation((prevConversation) => prevConversation ? {
        ...prevConversation,
        lastMessageUserName: incomingMessage.senderName,
      } : prevConversation);
    };

    const handleOnlineCount = (payload: ConversationOnlineCountPayload) => {
      if (payload.conversationId !== conversationId) {
        return;
      }

      setOnlineCount(payload.onlineCount);
    };

    socketService.on(SocketEvent.CONVERSATION_MESSAGE_NEW, handleRealtimeMessage);
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
      socketService.off(SocketEvent.CONVERSATION_ONLINE_COUNT, handleOnlineCount);
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();

    if (!conversationId || !trimmedMessage || isSending || !currentUser?.id) {
      return;
    }

    try {
      setIsSending(true);
      setSendError(null);

      const createdMessage = await messageService.createMessage({
        conversationId,
        content: trimmedMessage,
        messageType: 'text',
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
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Lỗi khi gửi tin nhắn');
    } finally {
      setIsSending(false);
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
          <div className={styles.avatarGroupSmall}>
            <img src="https://i.pravatar.cc/150?u=1" alt="" />
            <img src="https://i.pravatar.cc/150?u=2" alt="" />
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
                time={new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                isSent={isSent}
                isNew={message._id === highlightedMessageId}
              />
            </div>
          );})
        )}
      </div>

      {/* Input Area */}
      <footer className={styles.inputArea}>
        {sendError && <div className={styles.sendError}>{sendError}</div>}
        <div className={styles.tools}>
          <button><FontAwesomeIcon icon={faPlus} /></button>
          <button><FontAwesomeIcon icon={faImage} /></button>
          <button><FontAwesomeIcon icon={faPaperclip} /></button>
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
          disabled={isSending || !newMessage.trim()}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </footer>
    </main>
  );
};

export default ChatWindow;