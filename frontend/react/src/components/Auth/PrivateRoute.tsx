import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface PrivateRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = requiredRole.split(',').map(r => r.trim());
    const hasRole = roles.some(role => user?.roles.includes(role));
    
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

