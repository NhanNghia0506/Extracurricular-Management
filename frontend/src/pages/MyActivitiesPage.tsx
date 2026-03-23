import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MyActivities from '../components/MyActivities/my.activites';
import { ActivitySearchOutletContext } from '../layouts/BaseLayout/baselayout';

const MyActivitiesPage: React.FC = () => {
    const outletContext = useOutletContext<ActivitySearchOutletContext | undefined>();

    return (
        <MyActivities searchTerm={outletContext?.activitySearchTerm || ''} />
    );
};

export default MyActivitiesPage;
