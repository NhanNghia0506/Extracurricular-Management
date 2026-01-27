import React, { useState } from 'react';
import styles from './sidebar.module.scss';

// 1. Định nghĩa kiểu dữ liệu cho Item
interface MenuItem {
    id: string;
    icon: string; // Class name của FontAwesome
    label: string;
    isDanger?: boolean; // Tùy chọn: đánh dấu mục nguy hiểm (như Sign Out)
}

// 2. Khởi tạo mảng dữ liệu (như bạn yêu cầu)
const MAIN_MENU: MenuItem[] = [
    { id: 'explore', icon: 'fa-regular fa-compass', label: 'Khám phá' },
    { id: 'my-activities', icon: 'fa-regular fa-calendar-check', label: 'Hoạt động của tôi' },
    { id: 'organizations', icon: 'fa-solid fa-users-line', label: 'Tổ chức' }, // Hoặc fa-user-group
    { id: 'achievements', icon: 'fa-solid fa-medal', label: 'Thành tích' },
];

const BOTTOM_MENU: MenuItem[] = [
    { id: 'settings', icon: 'fa-solid fa-gear', label: 'Cài đặt' },
    { id: 'sign-out', icon: 'fa-solid fa-arrow-right-from-bracket', label: 'Đăng xuất', isDanger: true },
];

interface SidebarProps {
    onNavigate?: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    // State để lưu mục đang được chọn (Mặc định là 'explore')
    const [activeId, setActiveId] = useState<string>('explore');

    const handleItemClick = (item: MenuItem) => {
        setActiveId(item.id);
        if (onNavigate) {
            onNavigate(item.id);
        }
        // Nếu là sign-out thì có thể xử lý logic logout riêng ở đây
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
        <aside className={styles.sidebarWrapper}>
            {/* --- Phần Menu Chính --- */}
            <nav className="d-flex flex-column gap-1">
                {MAIN_MENU.map((item) => renderMenuItem(item))}
            </nav>

            {/* --- Phần Menu Đáy (Settings & Logout) --- */}
            <div className={styles.footerMenu}>
                {BOTTOM_MENU.map((item) => renderMenuItem(item))}
            </div>
        </aside>
    );
};

export default Sidebar;