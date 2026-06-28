import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Verifying access..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirect to appropriate dashboard based on role
    switch (userProfile.role) {
      case 'admin': return <Navigate to="/admin" replace />;
      case 'authority': return <Navigate to="/authority" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }

  if (userProfile?.isBanned) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-center p-8 glass rounded-2xl max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Account Suspended</h2>
          <p className="text-slate-400">Your account has been suspended for violating community guidelines. Contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
