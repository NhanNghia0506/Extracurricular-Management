import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/header';
import Sidebar from '../components/SideBar/sidebar'; // Sidebar Trái
import styles from './withsidebarlayout.module.scss';

const WithSidebarLayout: React.FC = () => {
    return (
        <div className={styles.appContainer}>
            <Header />

            <div className={styles.bodyContainer}>
                {/* Cột 1: Menu trái (Ẩn trên mobile) */}
                <div className="d-none d-lg-block h-100">
                    <Sidebar />
                </div>

                {/* Cột 2: Nội dung chính (Cuộn được) */}
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default WithSidebarLayout;
