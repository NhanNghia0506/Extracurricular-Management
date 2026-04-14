import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Import CSS Module
import styles from './header.module.scss';

// Fontawesome for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faMessage } from '@fortawesome/free-regular-svg-icons';

import logo from 'assets/images/logoUniActivity.png';
import authService from 'services/auth.service';
import notificationService from 'services/notification.service';
import activityService from 'services/activity.service';
import { ActivityListItem } from '../../../types/activity.types';
import UserAvatar from '../../../components/UserAvatar/user.avatar';
import { NOTIFICATION_UNREAD_COUNT_EVENT } from '../../../utils/notification-realtime';
import { resolveImageSrc } from '../../../utils/image-url';

interface HeaderProps {
    onSearch?: (value: string) => void;
    searchValue?: string;
}

const Header: React.FC<HeaderProps> = ({ onSearch, searchValue }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ name: string; email: string; avatar?: string | null } | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [localSearchValue, setLocalSearchValue] = useState(searchValue || '');
    const [activities, setActivities] = useState<ActivityListItem[]>([]);
    const [searchFocused, setSearchFocused] = useState(false);
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
    const [role, setRole] = useState<string | null>('');
    const adminDropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof searchValue === 'string') {
            setLocalSearchValue(searchValue);
        }
    }, [searchValue]);

    // Get user role
    useEffect(() => {
        setRole(authService.getRole());
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
                setAdminDropdownOpen(false);
            }

            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false);
            }
        };

        if (adminDropdownOpen || searchFocused) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [adminDropdownOpen, searchFocused]);

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

    useEffect(() => {
        let isMounted = true;

        activityService.list()
            .then((response) => {
                if (!isMounted) {
                    return;
                }

                const payload = response.data;
                const nextActivities: ActivityListItem[] = Array.isArray(payload?.data)
                    ? payload.data
                    : (payload?.data?.data || []);

                if (Array.isArray(nextActivities)) {
                    setActivities(nextActivities);
                }
            })
            .catch(() => {
                // Ignore search source fetch errors in header.
            });

        notificationService.getUnreadCount()
            .then((response) => {
                if (!isMounted) {
                    return;
                }

                setUnreadCount(response.data.data.unreadCount);
            })
            .catch(() => {
                // Ignore unread count fetch errors in header.
            });

        const handleUnreadCount = (event: Event) => {
            const customEvent = event as CustomEvent<{ unreadCount: number }>;
            setUnreadCount(customEvent.detail?.unreadCount || 0);
        };

        window.addEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCount);

        return () => {
            isMounted = false;
            window.removeEventListener(NOTIFICATION_UNREAD_COUNT_EVENT, handleUnreadCount);
        };
    }, []);

    const isAuthenticated = Boolean(user);
    const displayName = user?.name || '';
    const avatarUrl = user?.avatar || undefined;

    const normalizedKeyword = localSearchValue.trim().toLowerCase();
    const searchResults = normalizedKeyword
        ? activities
            .filter((activity) => {
                const organizerName = typeof activity.organizerId === 'string'
                    ? activity.organizerId
                    : (activity.organizerId?.name || '');

                return [activity.title, organizerName]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
            })
            .slice(0, 6)
        : [];
    const showSearchDropdown = searchFocused && normalizedKeyword.length > 0;

    const resolveActivityImage = (activity: ActivityListItem): string => resolveImageSrc(activity.image)
        || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400&auto=format&fit=crop';

    const handleSelectActivity = (activityId: string) => {
        setSearchFocused(false);
        navigate(`/activity-detail?id=${activityId}`);
    };

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
                    <div className={`${styles.searchContainer} d-none d-md-block`} ref={searchRef}>
                        <i className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`}></i>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search activities, clubs, or events..."
                            value={typeof searchValue === 'string' ? searchValue : localSearchValue}
                            onFocus={() => setSearchFocused(true)}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                setLocalSearchValue(nextValue);
                                onSearch && onSearch(nextValue);
                            }}
                        />

                        {showSearchDropdown && (
                            <div className={styles.searchDropdown}>
                                {searchResults.length === 0 ? (
                                    <div className={styles.searchEmpty}>Không tìm thấy hoạt động phù hợp.</div>
                                ) : (
                                    searchResults.map((activity) => {
                                        const organizerName = typeof activity.organizerId === 'string'
                                            ? activity.organizerId
                                            : (activity.organizerId?.name || 'Ban tổ chức chưa cập nhật');

                                        return (
                                            <button
                                                key={activity._id}
                                                type="button"
                                                className={styles.searchItem}
                                                onClick={() => handleSelectActivity(activity._id)}
                                            >
                                                <img
                                                    src={resolveActivityImage(activity)}
                                                    alt={activity.title}
                                                    className={styles.searchItemImage}
                                                />
                                                <span className={styles.searchItemText}>
                                                    <strong>{activity.title}</strong>
                                                    <small>{organizerName}</small>
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- 3. Right: Auth or Profile --- */}
                    <div className="d-flex align-items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Admin Management Dropdown */}
                                {role === 'ADMIN' && (
                                    <div className={styles.adminDropdown} ref={adminDropdownRef}>
                                        <button
                                            className={styles.actionBtn}
                                            aria-label="Quản lý"
                                            onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                                        >
                                            <i className="fa-solid fa-sliders"></i>
                                        </button>
                                        {adminDropdownOpen && (
                                            <div className={styles.dropdownMenu}>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/student-stats');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-chart-line"></i>
                                                    <span>Thống kê sinh viên</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/organizer-stats');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-people-group"></i>
                                                    <span>Thống kê ban tổ chức</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/activity-stats');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-chart-column"></i>
                                                    <span>Thống kê hoạt động</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/activity-approval');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-check-circle"></i>
                                                    <span>Duyệt hoạt động</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/organizer-approval');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-check-double"></i>
                                                    <span>Duyệt tổ chức</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/activity-categories');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-list"></i>
                                                    <span>Danh mục hoạt động</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/verify-certificate');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-qrcode"></i>
                                                    <span>Quét QR xác thực chứng nhận</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/training-score-report');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-file-chart-line"></i>
                                                    <span>Báo cáo điểm rèn luyện</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/academic');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-school"></i>
                                                    <span>Quản lý khoa lớp</span>
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        navigate('/admin/complaints');
                                                        setAdminDropdownOpen(false);
                                                    }}
                                                >
                                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                                    <span>Xử lý khiếu nại</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notification Bell */}
                                <button className={styles.actionBtn} aria-label="Notifications" onClick={() => navigate('/notifications')}>
                                    <FontAwesomeIcon icon={faBell} />
                                    {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                                </button>

                                <Link className={styles.actionBtnLink} to="/chat" aria-label="Tin nhắn">
                                    <FontAwesomeIcon icon={faMessage} />
                                </Link>

                                {/* User Avatar */}
                                <div className={styles.profileInfo}>
                                    {displayName && (
                                        <span className={styles.profileName}>{displayName}</span>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.avatarButton}
                                        onClick={() => navigate('/student-dashboard')}
                                        aria-label="Mở trang hồ sơ sinh viên"
                                    >
                                        <UserAvatar
                                            src={avatarUrl}
                                            name={displayName}
                                            alt="User Profile"
                                            className={styles.avatar}
                                        />
                                    </button>
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