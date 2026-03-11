import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';

interface ProtectedRouteProps {
    children: React.ReactElement;
    allowedRoles?: string[];
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles,
    redirectTo = '/',
}) => {
    const location = useLocation();

    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const currentUserRole = authService.getRole();

        if (!currentUserRole || !allowedRoles.includes(currentUserRole)) {
            return <Navigate to={redirectTo} replace state={{ from: location }} />;
        }
    }

    return children;
};

export default ProtectedRoute;
