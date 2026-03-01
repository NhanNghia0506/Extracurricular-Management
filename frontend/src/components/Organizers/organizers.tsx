import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlusCircle, faSearch, faSlidersH,
    faEnvelope, faPhoneAlt, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import styles from './organizers.module.scss';

// Mock data cho danh sách
const organizers = [
    {
        id: 1,
        name: "Robotics Innovation C...",
        type: "STUDENT CLUB",
        faculty: "Engineering Faculty",
        email: "contact@robotics.uni.edu",
        phone: "+1 (555) 012-3456",
        desc: "Pioneering the future through competitive robotics, drone development, and AI research.",
        logo: "🤖"
    },
    // Thêm các item khác vào đây...
];

const Organizers: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* 1. Header */}
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Organizers Directory</h1>
                    <p>Connect with university clubs, academic departments, and administrative bodies managing campus events.</p>
                </div>
                <button className={styles.btnRegister}>
                    <FontAwesomeIcon icon={faPlusCircle} /> Register Organizer
                </button>
            </header>

            {/* 2. Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                    <input type="text" placeholder="Search organizers by name, department, or keyword..." />
                </div>
                <div className={styles.dropdowns}>
                    <div className={styles.selectBox}>
                        <span>Type: <strong>All</strong></span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                    <div className={styles.selectBox}>
                        <span>Department</span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                    <button className={styles.btnAdvanced}>
                        <FontAwesomeIcon icon={faSlidersH} /> Advanced Filters
                    </button>
                </div>
            </div>

            {/* 3. Grid List */}
            <div className={styles.directoryGrid}>
                {organizers.map(org => (
                    <div key={org.id} className={styles.organizerCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.logoBadge}>{org.logo}</div>
                            <div className={styles.badgeInfo}>
                                <span className={styles.typeTag}>{org.type}</span>
                                <h3>{org.name}</h3>
                                <span className={styles.facultyName}>{org.faculty}</span>
                            </div>
                        </div>

                        <div className={styles.contactInfo}>
                            <div className={styles.infoRow}>
                                <FontAwesomeIcon icon={faEnvelope} /> <span>{org.email}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <FontAwesomeIcon icon={faPhoneAlt} /> <span>{org.phone}</span>
                            </div>
                        </div>

                        <p className={styles.description}>{org.desc}</p>

                        <div className={styles.cardActions}>
                            <button className={styles.btnView}>View Activities</button>
                            <button className={styles.btnContact}>Contact</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Organizers;