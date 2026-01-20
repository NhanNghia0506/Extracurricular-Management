import React from 'react';
// Import CSS Module
import styles from './header.module.scss';

// Fontawesome for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from '@fortawesome/free-regular-svg-icons';

// Placeholder cho logo và avatar (Thay bằng đường dẫn thật của bạn)
import logo from 'assets/images/logoUniActivity.png';
const avatarSrc = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

interface HeaderProps {
    onSearch?: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
    return (
        <header className={styles.headerWrapper}>
            {/* Container-fluid giúp nội dung trải rộng nhưng vẫn có padding 2 bên */}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center">

                    {/* --- 1. Left: Logo & Brand --- */}
                    <a href="/" className={styles.brandLink}>
                        <img
                            src={logo}
                            alt="UniActivity Logo"
                            className={styles.logoImage}
                        />
                    </a>

                    {/* --- 2. Center: Search Bar --- */}
                    {/* d-none d-md-block: Ẩn trên mobile, hiện trên màn hình medium trở lên */}
                    <div className={`${styles.searchContainer} d-none d-md-block`}>
                        <i className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`}></i>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search activities, clubs, or events..."
                            onChange={(e) => onSearch && onSearch(e.target.value)}
                        />
                    </div>

                    {/* --- 3. Right: Notification & Profile --- */}
                    <div className="d-flex align-items-center gap-3">
                        {/* Notification Bell */}
                        <button className={styles.actionBtn} aria-label="Notifications">
                            <FontAwesomeIcon icon={faBell} />
                        </button>

                        {/* User Avatar */}
                        <div className={styles.avatar}>
                            <img
                                src={avatarSrc}
                                alt="User Profile"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;