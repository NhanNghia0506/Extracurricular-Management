import React from 'react';
import MainLayout from '../layouts/MainLayout/mainlayout';
import CreateActivity from '../components/CreateActivity/create.activity';

const CreateActivityPage: React.FC = () => {
    return (
        <MainLayout>
            <CreateActivity />
        </MainLayout>
    );
};

export default CreateActivityPage;
