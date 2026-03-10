import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Import CSS Module
import styles from './header.module.scss';

// Fontawesome for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMessage } from '@fortawesome/free-regular-svg-icons';

import logo from 'assets/images/logoUniActivity.png';
import authService from 'services/auth.service';
import UserAvatar from '../../../components/UserAvatar/user.avatar';

interface HeaderProps {
    onSearch?: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
    const [user, setUser] = useState<{ name: string; email: string; avatar?: string | null } | null>(null);

    useEffect(() => {
        let isMounted = true;

        authService.getProfile()
            .then((response) => {
                if (!isMounted) return;
                if (response.success) {
                    setUser(response.data);
                }
            })
            .catch(() => {
                // Ignore profile fetch errors; header still renders.
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const isAuthenticated = Boolean(user);
    const displayName = user?.name || '';
    const avatarUrl = user?.avatar || undefined;

    return (
        <header className={styles.headerWrapper}>
            {/* Container-fluid giúp nội dung trải rộng nhưng vẫn có padding 2 bên */}
            <div className="container-fluid p-0">
                <div className="d-flex justify-content-between align-items-center">

                    {/* --- 1. Left: Logo & Brand --- */}
                    <Link to="/" className={styles.brandLink}>
                        <img
                            src={logo}
                            alt="UniActivity Logo"
                            className={styles.logoImage}
                        />
                    </Link>

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

                    {/* --- 3. Right: Auth or Profile --- */}
                    <div className="d-flex align-items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Notification Bell */}
                                <button className={styles.actionBtn} aria-label="Notifications">
                                    <FontAwesomeIcon icon={faBell} />
                                </button>

                                <Link className={styles.actionBtnLink} to="/chat" aria-label="Tin nhắn">
                                    <FontAwesomeIcon icon={faMessage} />
                                </Link>

                                {/* User Avatar */}
                                <div className={styles.profileInfo}>
                                    {displayName && (
                                        <span className={styles.profileName}>{displayName}</span>
                                    )}
                                    <UserAvatar
                                        src={avatarUrl}
                                        name={displayName}
                                        alt="User Profile"
                                        className={styles.avatar}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className={styles.authActions}>
                                <Link className={styles.authLink} to="/register">
                                    Đăng ký
                                </Link>
                                <Link className={`${styles.authLink} ${styles.authLinkPrimary}`} to="/login">
                                    Đăng nhập
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;