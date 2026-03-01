import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faClock,
    faExternalLinkAlt,
    faArchive,
    faTrashAlt,
    faFlag,
    faInfoCircle,
    faExclamationTriangle,
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import styles from './notification.detail.module.scss';

const NotificationDetail: React.FC = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.mainContent}>
                {/* Card xác nhận chính */}
                <section className={styles.card}>
                    <header className={styles.header}>
                        <div className={styles.brand}>
                            <div className={styles.logoCircle}>
                                <div className={styles.innerLogo} />
                            </div>
                            <div className={styles.brandText}>
                                <h3>Academic Registry <FontAwesomeIcon icon={faCheckCircle} className={styles.verifyIcon} /></h3>
                                <span>Official University Communication</span>
                            </div>
                        </div>
                        <div className={styles.meta}>
                            <span className={styles.badge}>ATTENDANCE CONFIRMATION</span>
                            <p><FontAwesomeIcon icon={faClock} /> Oct 24, 2023 • 09:45 AM</p>
                        </div>
                    </header>

                    <h1 className={styles.title}>Attendance Confirmed: Computer Science 101 - Lecture 08</h1>

                    <p className={styles.description}>
                        Hello Alex, this is an automated confirmation that your attendance for the
                        "Advanced Data Structures" lecture held today has been successfully recorded.
                    </p>

                    <p className={styles.stats}>
                        Your current attendance rate for this module is now <span className={styles.highlight}>94%</span>.
                        Keep up the consistent participation to maintain your academic standing and eligibility for final assessments.
                    </p>

                    <div className={styles.courseBanner}>
                        <div className={styles.courseInfo}>
                            <div className={styles.courseImg}>
                                <img src="https://via.placeholder.com/150x80" alt="Lecture room" />
                            </div>
                            <div className={styles.courseText}>
                                <h4>CS101: Advanced Data Structures</h4>
                                <p>Room 402, Engineering Building • 08:00 AM - 09:30 AM</p>
                                <a href="#">View Activity Details <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" /></a>
                            </div>
                        </div>
                        <button className={styles.btnPrimary}>Go to Dashboard</button>
                    </div>

                    <footer className={styles.cardFooter}>
                        <div className={styles.footerLeft}>
                            <button><FontAwesomeIcon icon={faArchive} /> Archive</button>
                            <button><FontAwesomeIcon icon={faTrashAlt} /> Delete</button>
                        </div>
                        <button className={styles.reportBtn}><FontAwesomeIcon icon={faFlag} /> Report issue</button>
                    </footer>
                </section>

                {/* Phần dưới cùng: Policy và Sidebar */}
                <div className={styles.bottomGrid}>
                    <div className={styles.policyNote}>
                        <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
                        <div>
                            <strong>Attendance Policy Note</strong>
                            <p>Remember that a minimum of 80% attendance is required for this course to be eligible for the final examination. You can track your overall progress in the Attendance tab.</p>
                        </div>
                    </div>

                    <aside className={styles.sidebar}>
                        <p className={styles.sidebarTitle}>Other notifications</p>

                        <div className={styles.notifItem}>
                            <div className={`${styles.notifIcon} ${styles.warningBg}`}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                            <div className={styles.notifText}>
                                <strong>Profile Update Required</strong>
                                <span>2 hours ago</span>
                            </div>
                        </div>

                        <div className={styles.notifItem}>
                            <div className={`${styles.notifIcon} ${styles.successBg}`}>
                                <FontAwesomeIcon icon={faCalendarAlt} />
                            </div>
                            <div className={styles.notifText}>
                                <strong>New Seminar Scheduled</strong>
                                <span>Yesterday</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetail;