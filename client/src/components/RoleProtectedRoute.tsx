import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  requireAuth?: boolean;
  fallbackPath?: string;
  showForbidden?: boolean;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  fallbackPath = '/',
  showForbidden = true,
}) => {
  const { user, loading } = useAuth();

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0) {
    const hasAccess = checkUserAccess(user, allowedRoles);
    
    if (!hasAccess) {
      if (showForbidden) {
        return <ForbiddenPage />;
      }
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

// Helper function to check user access based on roles
const checkUserAccess = (user: any, allowedRoles: string[]): boolean => {
  // Handle legacy isAdmin field
  if (allowedRoles.includes('admin') && user.isAdmin) {
    return true;
  }

  // Check role field
  if (user.role && allowedRoles.includes(user.role)) {
    return true;
  }

  // Check for super admin access (can access everything)
  if (user.role === 'super_admin') {
    return true;
  }

  return false;
};

// Forbidden page component
const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <div className="text-8xl font-bold text-netflix-red mb-4">403</div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Forbidden</h1>
          <p className="text-gray-400 mb-8">
            You don't have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="bg-netflix-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mr-4"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Home Page
          </button>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-center space-x-4 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-4h6a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h6zm-6-8h8" />
            </svg>
            <span className="text-sm">Restricted Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleProtectedRoute;