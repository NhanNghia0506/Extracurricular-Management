import React from 'react';
import styles from './notifications.center.module.scss';

const NOTIFICATIONS = [
    {
        id: 1,
        sender: "Office of Registrar",
        title: "New Attendance Policy Update",
        message: "Please review the updated GPS check-in requirements for the Spring semester. All students are now required to maintain a 50m proximity radius for lecture halls.",
        time: "10:30 AM",
        unread: true,
        type: "office"
    },
    {
        id: 2,
        sender: "CS101 - Intro to Computing",
        title: "Attendance Confirmed",
        message: "Your presence has been successfully logged via GPS for the lecture on Oct 24th, 2023. No further action is required.",
        time: "09:15 AM",
        unread: false,
        type: "class"
    },
    {
        id: 3,
        sender: "System Administrator",
        title: "Scheduled Maintenance Notice",
        message: "The CampusPulse GPS system will be offline for maintenance this Sunday from 2:00 AM to 4:00 AM UTC. Please log your weekend activities accordingly.",
        time: "Yesterday",
        unread: true,
        type: "alert"
    },
    {
        id: 4,
        sender: "Student Affairs Bureau",
        title: "Fall Festival Activity Registration",
        message: "Don't forget to check-in via GPS at the central plaza tomorrow to earn activity points for the Fall Festival event.",
        time: "Oct 22, 2023",
        unread: false,
        type: "event"
    },
    {
        id: 1,
        sender: "Office of Registrar",
        title: "New Attendance Policy Update",
        message: "Please review the updated GPS check-in requirements for the Spring semester. All students are now required to maintain a 50m proximity radius for lecture halls.",
        time: "10:30 AM",
        unread: true,
        type: "office"
    },
    {
        id: 2,
        sender: "CS101 - Intro to Computing",
        title: "Attendance Confirmed",
        message: "Your presence has been successfully logged via GPS for the lecture on Oct 24th, 2023. No further action is required.",
        time: "09:15 AM",
        unread: false,
        type: "class"
    },
    {
        id: 3,
        sender: "System Administrator",
        title: "Scheduled Maintenance Notice",
        message: "The CampusPulse GPS system will be offline for maintenance this Sunday from 2:00 AM to 4:00 AM UTC. Please log your weekend activities accordingly.",
        time: "Yesterday",
        unread: true,
        type: "alert"
    },
    {
        id: 4,
        sender: "Student Affairs Bureau",
        title: "Fall Festival Activity Registration",
        message: "Don't forget to check-in via GPS at the central plaza tomorrow to earn activity points for the Fall Festival event.",
        time: "Oct 22, 2023",
        unread: false,
        type: "event"
    }
];

const NotificationsCenter: React.FC = () => {
    return (
        <div className={styles.centerContainer}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h2>Notifications Center</h2>
                    <p>Stay updated with your campus activities and attendance logs.</p>
                </div>
                <button className={styles.markReadBtn}>
                    <i className="fa-solid fa-check-double"></i> Mark all as read
                </button>
            </header>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <div className={`${styles.tabItem} ${styles.active}`}>
                    <i className="fa-regular fa-envelope"></i> All <span className={styles.count}>12</span>
                </div>
                <div className={styles.tabItem}>
                    <i className="fa-regular fa-envelope-open"></i> Unread <span className={styles.count}>3</span>
                </div>
                <div className={styles.tabItem}>
                    <i className="fa-solid fa-triangle-exclamation"></i> System Alerts
                </div>
            </div>

            {/* Notification List */}
            {NOTIFICATIONS.map((noti) => (
                <div key={noti.id} className={`${styles.notificationItem} ${noti.unread ? styles.unread : ''}`}>
                    <div className={`${styles.avatar} ${noti.type === 'alert' ? styles.alertIcon : ''}`}>
                        {noti.type === 'alert' ? (
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        ) : (
                            <i className="fa-solid fa-building-columns"></i>
                        )}
                    </div>

                    <div className={styles.content}>
                        <div className={styles.senderRow}>
                            <span>{noti.sender}</span>
                            {noti.unread && <div className={styles.dot}></div>}
                        </div>
                        <h6>{noti.title}</h6>
                        <p>{noti.message}</p>
                    </div>

                    <div className={styles.timestamp}>{noti.time}</div>
                </div>
            ))}

            <button className={styles.loadMore}>Load more notifications</button>
        </div>
    );
};

export default NotificationsCenter;