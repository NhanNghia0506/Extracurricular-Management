import AttendanceDashboard from '../components/AttendanceDashboard/attendance.dashboard';
import React from 'react';
import { useLocation } from 'react-router-dom';

const HomePage: React.FC = () => {
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('sessionId') || '';

    return (
        <AttendanceDashboard sessionId={sessionId} />
    );
};

export default HomePage;
