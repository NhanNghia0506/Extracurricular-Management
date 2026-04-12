import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/header';
import Sidebar from '../components/SideBar/sidebar';
import styles from './baselayout.module.scss';

export interface ActivitySearchOutletContext {
    activitySearchTerm: string;
}

interface BaseLayoutProps {
    rightSidebar?: React.ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ rightSidebar }) => {
    const [activitySearchTerm, setActivitySearchTerm] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <div className={styles.appContainer}>
            <Header onSearch={setActivitySearchTerm} searchValue={activitySearchTerm} />

            <button
                type="button"
                className={styles.mobileNavToggle}
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Mở menu điều hướng"
            >
                <i className="fa-solid fa-bars"></i>
                <span>Menu</span>
            </button>

            {isMobileNavOpen && (
                <div className={styles.mobileNavOverlay} onClick={() => setIsMobileNavOpen(false)}>
                    <div className={styles.mobileNavPanel} onClick={(event) => event.stopPropagation()}>
                        <div className={styles.mobileNavHeader}>
                            <h3>Điều hướng</h3>
                            <button
                                type="button"
                                className={styles.mobileNavClose}
                                onClick={() => setIsMobileNavOpen(false)}
                                aria-label="Đóng menu điều hướng"
                            >
                                ×
                            </button>
                        </div>
                        <Sidebar onItemSelected={() => setIsMobileNavOpen(false)} className={styles.mobileSidebarContent} />
                    </div>
                </div>
            )}

            <div className={styles.bodyContainer}>
                {/* Cột 1: Menu trái (Ẩn trên mobile) */}
                <div className="d-none d-lg-block h-100">
                    <Sidebar />
                </div>

                {/* Cột 2: Nội dung chính (Cuộn được) */}
                <main className={styles.mainContent}>
                    <Outlet context={{ activitySearchTerm }} />
                </main>

                {/* Cột 3: Sidebar phải (Chỉ hiện trên màn hình lớn) */}
                {rightSidebar && (
                    <div className="d-none d-xl-block h-100">
                        {rightSidebar}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BaseLayout;
