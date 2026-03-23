import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Feed from '../layouts/components/Feed/feed';
import { ActivitySearchOutletContext } from '../layouts/BaseLayout/baselayout';

const HomePage: React.FC = () => {
    const outletContext = useOutletContext<ActivitySearchOutletContext | undefined>();

    return (
        <Feed searchTerm={outletContext?.activitySearchTerm || ''} />
    );
};

export default HomePage;
