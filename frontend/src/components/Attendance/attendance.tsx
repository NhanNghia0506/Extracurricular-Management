import React from 'react';
import styles from './attendance.module.scss';
import AttendanceMap from './attendance.map';

const Attendance: React.FC = () => {
    return (
        <div className={styles.attendanceContainer}>

            {/* CỘT TRÁI: BẢN ĐỒ */}
            <AttendanceMap />

            {/* CỘT PHẢI: CHI TIẾT */}
            <aside className={styles.infoColumn}>

                {/* Section 1: Current Session */}
                <div>
                    <h6 className="text-muted small fw-bold mb-3 uppercase">Current Session</h6>
                    <div className={styles.sessionCard}>
                        <div className={styles.sessionImg}>
                            <span className={styles.badgeOngoing}>ONGOING</span>
                        </div>
                        <div className={styles.sessionBody}>
                            <h5>CS301 - Advanced Web Development</h5>
                            <span className={styles.location}><i className="fa-solid fa-book-bookmark me-2"></i>Lecture Hall B, Level 3</span>

                            <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <small className="text-muted d-block">LECTURER</small>
                                    <span className="fw-bold small">Dr. Sarah Jenkins</span>
                                </div>
                                <div>
                                    <small className="text-muted d-block">TIME SLOT</small>
                                    <span className="fw-bold small">10:00 - 12:00</span>
                                </div>
                            </div>

                            <div className={styles.infoBox}>
                                <i className="fa-solid fa-circle-info mt-1"></i>
                                <p className="m-0">Your current GPS coordinates (40.7128° N) are 120m away from the lecture hall.</p>
                            </div>

                            <button className={styles.checkinBtn}>
                                <i className="fa-solid fa-fingerprint"></i>
                                Enter Zone to Check-in
                            </button>
                            <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.65rem' }}>Check-in available until 10:15 AM</p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Next Session */}
                <div>
                    <h6 className="text-muted small fw-bold mb-3 uppercase">Next Session</h6>
                    <div className={styles.nextSessionItem}>
                        <div className="d-flex align-items-center gap-3">
                            <div className={styles.iconBox}><i className="fa-solid fa-code"></i></div>
                            <div>
                                <div className="fw-bold small">CS305 - Database Systems</div>
                                <small className="text-muted">Lab 201 • 01:00 PM</small>
                            </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-muted small"></i>
                    </div>
                </div>

                {/* Section 3: Help Box */}
                <div className={styles.helpBox}>
                    <h6 className="fw-bold">Need help?</h6>
                    <p className="small opacity-75">If your location isn't updating, try refreshing the page or checking your device settings.</p>
                    <a href="#" className="text-white text-decoration-none small fw-bold">Contact Support <i className="fa-solid fa-arrow-up-right-from-square ms-1"></i></a>
                </div>

            </aside>
        </div>
    );
};

export default Attendance;