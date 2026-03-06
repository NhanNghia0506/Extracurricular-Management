import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faImage, faPaperclip, faPaperPlane, faSmile, faInfoCircle, faUsers } from '@fortawesome/free-solid-svg-icons';
import styles from './chat.window.module.scss';
import MessageItem from './MessageItem';
import conversationService from '../../services/conversation.service';
import messageService from '../../services/message.service';
import authService from '../../services/auth.service';
import { Message } from '../../types/message.types';

interface Conversation {
  _id: string;
  title: string;
  participantsCount: number;
  lastMessageUserName?: string;
}

const ChatWindow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('Id');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const currentUser = authService.getCurrentUser();

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

  const handleSendMessage = async () => {
    const trimmedMessage = newMessage.trim();

    if (!conversationId || !trimmedMessage || isSending || !currentUser?.id) {
      return;
    }

    try {
      setIsSending(true);
      setSendError(null);

      await messageService.createMessage({
        conversationId,
        content: trimmedMessage,
        messageType: 'text',
        senderAvatar: currentUser.avatar || undefined,
      });

      const refreshedMessages = await messageService.getConversationMessages(conversationId);
      setMessages([...refreshedMessages].reverse());
      setConversation((prevConversation) => prevConversation ? {
        ...prevConversation,
        lastMessageUserName: currentUser.name,
      } : prevConversation);
      setNewMessage('');

      await conversationService.updateLastMessage(conversationId, {
        content: trimmedMessage,
        userId: currentUser.id,
        userName: currentUser.name,
      });
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
          <div className={styles.avatarGroupSmall}>
            <img src="https://i.pravatar.cc/150?u=1" alt="" />
            <img src="https://i.pravatar.cc/150?u=2" alt="" />
          </div>
          <div className={styles.titleInfo}>
            <h3>{conversation.title}</h3>
            <span>{conversation.participantsCount} Thành viên • <span className={styles.online}>24 online</span></span>
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
          messages.map((message) => (
            <MessageItem
              key={message._id}
              avatar={message.senderAvatar || `https://i.pravatar.cc/150?u=${message.senderId}`}
              senderName={message.senderName}
              content={message.content}
              time={new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              isSent={message.senderId === currentUser?.id}
            />
          ))
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