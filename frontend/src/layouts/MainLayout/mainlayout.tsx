import React from 'react';
import RightSidebar from '../components/RightSideBar/rightsidebar'; // Sidebar Phải mới tạo
import BaseLayout from '../BaseLayout/baselayout';

const MainLayout: React.FC = () => {
    return (
        <BaseLayout rightSidebar={<RightSidebar />} />
    );
};

export default MainLayout;