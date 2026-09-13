import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, isAdmin } = useAuth();
    const location = useLocation();

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
    return children;
};

export default ProtectedRoute;
