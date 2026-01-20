import React from 'react';
import Header from '../components/Header/header';
import Sidebar from '../components/SideBar/sidebar'; // Sidebar Trái
import RightSidebar from '../components/RightSideBar/rightsidebar'; // Sidebar Phải mới tạo
import styles from './mainlayout.module.scss';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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
                    {children}
                </main>

                {/* Cột 3: Sidebar phải (Chỉ hiện trên màn hình lớn) */}
                <div className="d-none d-xl-block h-100">
                    <RightSidebar />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;