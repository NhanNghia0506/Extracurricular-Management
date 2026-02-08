import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header/header';
import styles from './nosidebarlayout.module.scss';

const NoSidebarLayout: React.FC = () => {
    return (
        <div className={styles.appContainer}>
            <Header />

            <div className={styles.bodyContainer}>
                {/* Nội dung chính (Cuộn được) */}
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default NoSidebarLayout;
