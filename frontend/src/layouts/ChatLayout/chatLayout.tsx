import React from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import Header from '../components/Header/header';
import ConversationSidebar from '../components/ConversationSideBar/conversation.sidebar';
import styles from './chatLayout.module.scss';

const ChatLayout: React.FC = () => {
    const [searchParams] = useSearchParams();
    const hasActiveConversation = Boolean(searchParams.get('Id'));

    return (
        <div className={styles.chatLayoutContainer}>
            <Header />

            <div
                className={[
                    styles.chatBody,
                    hasActiveConversation ? styles.mobileShowContent : styles.mobileShowSidebar,
                ].join(' ')}
            >
                {/* Sidebar trái: Danh sách conversations */}
                <div className={styles.leftSidebar}>
                    <ConversationSidebar />
                </div>

                {/* Nội dung chính: Sẽ được render dựa trên item được click */}
                <main className={styles.chatContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ChatLayout;
