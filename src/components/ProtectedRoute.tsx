import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  admin?: boolean;
}

const ProtectedRoute = ({ children, admin = false }: ProtectedRouteProps) => {
  const location = useLocation();
  
  if (admin) {
    // For admin routes, check for admin token
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
      // If no admin token, redirect to admin login
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    // If admin token exists, allow access
    return <>{children}</>;
  } else {
    // For user routes, check for user token
    const userToken = localStorage.getItem('token');
    
    if (!userToken) {
      // If no user token, redirect to user login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // If user token exists, allow access
    return <>{children}</>;
  }
};

export default ProtectedRoute;
