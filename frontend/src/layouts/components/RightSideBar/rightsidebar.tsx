import React from 'react';
import styles from './rightsidebar.module.scss';

// --- Interfaces ---
interface Club {
    id: string;
    name: string;
    members: string;
    icon: string; // FontAwesome class
    theme: 'purple' | 'green'; // Để chỉnh màu icon
}

interface Message {
    id: string;
    sender: string;
    avatar: string;
    preview: string;
    isOnline: boolean;
}

// --- Mock Data ---
const CLUBS: Club[] = [
    {
        id: '1',
        name: 'Debate Society',
        members: '1.2k members',
        icon: 'fa-solid fa-brain',
        theme: 'purple'
    },
    {
        id: '2',
        name: 'Green Campus',
        members: '850 members',
        icon: 'fa-solid fa-leaf',
        theme: 'green'
    }
];

const MESSAGES: Message[] = [
    {
        id: '1',
        sender: 'Sarah Miller',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        preview: 'Are you coming to the meet?',
        isOnline: true
    },
    {
        id: '2',
        sender: 'Alex Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        preview: 'The project files are ready.',
        isOnline: true
    }
];

const RightSidebar: React.FC = () => {
    return (
        <aside className={styles.wrapper}>

            {/* --- Section 1: Recommended Clubs --- */}
            <div className="mb-5">
                <div className={styles.sectionTitle}>Nhóm đề xuất</div>

                {CLUBS.map((club) => (
                    <div key={club.id} className={styles.clubItem}>
                        <div className={styles.clubInfo}>
                            {/* Icon với class màu động */}
                            <div className={`${styles.clubIcon} ${styles[club.theme]}`}>
                                <i className={club.icon}></i>
                            </div>
                            <div>
                                <span className={styles.clubName}>{club.name}</span>
                                <span className={styles.memberCount}>{club.members}</span>
                            </div>
                        </div>
                        <button className={styles.joinBtn}>Join</button>
                    </div>
                ))}
            </div>

            {/* --- Section 2: Active Messages --- */}
            <div className="mb-5">
                <div className={styles.sectionTitle}>
                    Tin nhắn đang hoạt động
                    <span className={styles.badgeCount}>3</span>
                </div>

                {MESSAGES.map((msg) => (
                    <div key={msg.id} className={styles.messageItem}>
                        <div className={styles.avatarWrapper}>
                            <img src={msg.avatar} alt={msg.sender} />
                            {msg.isOnline && <span className={styles.onlineDot}></span>}
                        </div>
                        <div>
                            <span className={styles.senderName}>{msg.sender}</span>
                            <span className={styles.previewText}>{msg.preview}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- Section 3: Pro Tip --- */}
            <div className={styles.proTipCard}>
                <h6>Pro Tip</h6>
                <p>
                    Hãy tham gia vào nhóm chat sau khi đăng ký tham gia hoạt động để nhận được các thông báo mới nhất <strong>Chúc thành công</strong>!
                </p>
            </div>

        </aside>
    );
};

export default RightSidebar;