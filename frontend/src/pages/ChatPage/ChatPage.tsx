import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatWindow from '../../components/ChatWindow/chat.window';
import styles from './chat.page.module.scss';

const ChatPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const conversationId = searchParams.get('Id');

    if (!conversationId) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyCard}>
                    <h2>Chọn một cuộc trò chuyện</h2>
                    <p>Trên điện thoại, danh sách hội thoại sẽ hiện trước. Chọn một cuộc trò chuyện để mở cửa sổ chat.</p>
                </div>
            </div>
        );
    }

    return <ChatWindow />;
};

export default ChatPage;