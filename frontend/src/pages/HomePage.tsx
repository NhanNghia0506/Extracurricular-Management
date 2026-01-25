import React from 'react';
import MainLayout from '../layouts/MainLayout/mainlayout';
import Feed from '../layouts/components/Feed/feed';

const HomePage: React.FC = () => {
    return (
        <MainLayout>
            <Feed />
        </MainLayout>
    );
};

export default HomePage;
