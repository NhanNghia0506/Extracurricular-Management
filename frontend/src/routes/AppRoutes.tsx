import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout/mainlayout';
import WithSidebarLayout from '../layouts/WithSidebarLayout/withsidebarlayout';
import NoSidebarLayout from '../layouts/NoSidebarLayout/nosidebarlayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';
import CreateActivityPage from '../pages/CreateActivityPage';
import AttendancePage from '../pages/AttendancePage';
import ActivityDetailPage from '../pages/ActivityDetailPage';
import ActivityParticipantsPage from '../pages/ActivityParticipantsPage';
import ProtectedRoute from './ProtectedRoute';
import ConfigureAttendancePage from '../pages/ConfigureAttendancePage';
import MyActivitiesPage from '../pages/MyActivitiesPage';
import UpdateActivityPage from '../pages/UpdateActivityPage';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Login không dùng layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Routes dùng MainLayout */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/create-activity"
                    element={
                        <ProtectedRoute>
                            <CreateActivityPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/update-activity"
                    element={
                        <ProtectedRoute>
                            <UpdateActivityPage />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route element={<WithSidebarLayout />}>
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/detail/:id" element={<ActivityDetailPage />} />
                <Route path="/configure-attendance" element={<ConfigureAttendancePage />} />
                <Route path="/my-activities" element={<MyActivitiesPage />} />
            </Route>

            <Route element={<NoSidebarLayout />}>
                <Route path="/participants/:activityId" element={<ActivityParticipantsPage />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
