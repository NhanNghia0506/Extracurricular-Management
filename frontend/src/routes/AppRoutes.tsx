import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import MyAttendancePage from '../pages/MyAttendancePage';
import MyCertificatesPage from '../pages/MyCertificatesPage';
import UpdateActivityPage from '../pages/UpdateActivityPage';
import CheckinSessionsPage from '../pages/CheckinSessionsPage';
import NotificationsCenterPage from '../pages/NotificationsCenter';
import NotificationDetailPage from '../pages/NotificationDetailPage';
import CreateNotificationPage from '../pages/CreateNotificationPage';
import AttendanceDashboardPage from '../pages/AttendanceDashboardPage';
import OrganizersPage from '../pages/OrganizersPage';
import CreateOraganizerPage from '../pages/CreateOraganizerPage';
import ChatLayout from '../layouts/ChatLayout/chatLayout';
import ChatPage from '../pages/ChatPage/ChatPage';
import LiveCheckinPage from '../pages/LiveCheckinPage';
import ActivityApprovalPage from '../pages/ActivityApprovalPage';
import OrganizerApprovalPage from '../pages/OrganizerApprovalPage';
import VerifyCertificatePage from '../pages/VerifyCertificatePage';
import authService from '../services/auth.service';

const AppRoutes: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        console.log('AppRoutes current user:', authService.getCurrentUser());
    }, [location.pathname]);

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
                <Route path="/activity-detail" element={<ActivityDetailPage />} />
                <Route path="/configure-attendance" element={<ConfigureAttendancePage />} />
                <Route path="/checkin-sessions" element={<CheckinSessionsPage />} />
                <Route path="/my-activities" element={<MyActivitiesPage />} />
                <Route path="/my-attendance" element={<MyAttendancePage />} />
                <Route path="/my-certificates" element={<MyCertificatesPage />} />
                <Route path="/organizations" element={<OrganizersPage />} />
                <Route
                    path="/create-organizer"
                    element={
                        <ProtectedRoute>
                            <CreateOraganizerPage />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route element={<NoSidebarLayout />}>
                <Route path="/participants/:activityId" element={<ActivityParticipantsPage />} />
                <Route path="/notifications" element={<NotificationsCenterPage />} />
                <Route path="/notification-detail" element={<NotificationDetailPage />} />
                <Route
                    path="/create-notification"
                    element={
                        <ProtectedRoute>
                            <CreateNotificationPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/attendance-dashboard" element={<AttendanceDashboardPage />} />
                <Route path="/live-checkin" element={<LiveCheckinPage />} />
                <Route
                    path="/activity-approval"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <ActivityApprovalPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/organizer-approval"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <OrganizerApprovalPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
            </Route>

            <Route element={<ChatLayout />}>
                <Route path="/chat" element={<ChatPage />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
