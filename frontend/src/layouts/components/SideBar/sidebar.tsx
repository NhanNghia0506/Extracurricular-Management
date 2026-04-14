import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './sidebar.module.scss';
import authService from '../../../services/auth.service';

// 1. Định nghĩa kiểu dữ liệu cho Item
interface MenuItem {
    id: string;
    icon: string; // Class name của FontAwesome
    label: string;
    isDanger?: boolean;// Tùy chọn: đánh dấu mục nguy hiểm (như Sign Out)
    subItems?: MenuItem[];
    isSubmenuParent?: boolean;
}

const USER_MENU: MenuItem[] = [
    { id: 'explore', icon: 'fa-regular fa-compass', label: 'Khám phá' },
    { id: 'my-activities', icon: 'fa-regular fa-calendar-check', label: 'Hoạt động của tôi' },
    { id: 'my-attendance', icon: 'fa-solid fa-clipboard-check', label: 'Lịch sử điểm danh' },
    { id: 'my-certificates', icon: 'fa-solid fa-certificate', label: 'Chứng nhận' },
    { id: 'complaints', icon: 'fa-solid fa-triangle-exclamation', label: 'Khiếu nại' },
    { id: 'organizations', icon: 'fa-solid fa-users-line', label: 'Tổ chức' }, // Hoặc fa-user-group
    { id: 'create-activity', icon: 'fa-solid fa-plus', label: 'Tạo hoạt động mới' },
];

const BOTTOM_MENU: MenuItem[] = [
    // { id: 'settings', icon: 'fa-solid fa-gear', label: 'Cài đặt' },
    { id: 'sign-out', icon: 'fa-solid fa-arrow-right-from-bracket', label: 'Đăng xuất', isDanger: true },
];

// Ánh xạ menu ID tới routes
const ROUTE_MAP: { [key: string]: string } = {
    'explore': '/',
    'my-activities': '/my-activities',
    'my-attendance': '/my-attendance',
    'my-certificates': '/my-certificates',
    'complaints': '/complaints',
    'organizations': '/organizations',
    'create-activity': '/create-activity',

    'settings': '/settings',

    'admin-student-stats': '/admin/student-stats',
    'admin-organizer-stats': '/admin/organizer-stats',
    'admin-activity-stats': '/admin/activity-stats',
    'activity-approval': '/activity-approval',
    'organizer-approval': '/organizer-approval',
    'admin-activity-categories': '/admin/activity-categories',
    'verify-certificate': '/verify-certificate',
    'admin-training-score-report': '/admin/training-score-report',
    'admin-attendance-report': '/admin/attendance-report',
    'admin-academic': '/admin/academic',
    'admin-complaints': '/admin/complaints',
};

const getActiveMenuIdFromPath = (pathname: string): string => {
    const entry = Object.entries(ROUTE_MAP).find(([, route]) => {
        if (route === '/') {
            return pathname === '/';
        }

        return pathname === route || pathname.startsWith(`${route}/`);
    });

    return entry?.[0] || 'explore';
};

interface SidebarProps {
    className?: string;
    onItemSelected?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, onItemSelected }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // State để lưu mục đang được chọn (Mặc định là 'explore')
    const [activeId, setActiveId] = useState<string>(getActiveMenuIdFromPath(location.pathname));

    React.useEffect(() => {
        setActiveId(getActiveMenuIdFromPath(location.pathname));
    }, [location.pathname]);

    const handleItemClick = (item: MenuItem) => {
        if (item.id === 'sign-out') {
            authService.logout();
            onItemSelected?.();
            return;
        }

        setActiveId(item.id);
        // Chuyển trang dựa vào route map
        const targetRoute = ROUTE_MAP[item.id];
        if (targetRoute) {
            navigate(targetRoute);
        }
        onItemSelected?.();
    };

    // Hàm render item để tái sử dụng
    const renderMenuItem = (item: MenuItem) => {
        // Kiểm tra xem item này có đang active không
        const isActive = activeId === item.id;

        // Kết hợp class: navItem + active (nếu có) + dangerItem (nếu có)
        const itemClasses = `
      ${styles.navItem} 
      ${isActive ? styles.active : ''} 
      ${item.isDanger ? styles.dangerItem : ''}
    `;

        return (
            <div
                key={item.id}
                className={itemClasses}
                onClick={() => handleItemClick(item)}
            >
                <i className={`${item.icon} ${styles.navIcon}`}></i>
                <span>{item.label}</span>
            </div>
        );
    };

    return (
        <aside className={`${styles.sidebarWrapper} ${className || ''}`.trim()}>
            {/* --- Phần Menu Chính --- */}
            <nav className={styles.menuStack}>
                <section className={styles.menuGroup}>
                    <div className={styles.sectionTitle}>Điều hướng</div>
                    <div className={styles.menuItems}>
                        {USER_MENU.map((item) => renderMenuItem(item))}
                    </div>
                </section>
            </nav>

            {/* --- Phần Menu Đáy (Settings & Logout) --- */}
            <div className={styles.footerMenu}>
                {BOTTOM_MENU.map((item) => renderMenuItem(item))}
            </div>
        </aside>
    );
};

export default Sidebar;