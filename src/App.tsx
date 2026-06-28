import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load all pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AuthorityLoginPage = lazy(() => import('./pages/auth/AuthorityLoginPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));

// Citizen pages
const CitizenDashboard = lazy(() => import('./pages/citizen/Dashboard'));
const ReportIssue = lazy(() => import('./pages/citizen/ReportIssue'));
const MyComplaints = lazy(() => import('./pages/citizen/MyComplaints'));
const ComplaintDetail = lazy(() => import('./pages/citizen/ComplaintDetail'));
const NearbyIssues = lazy(() => import('./pages/citizen/NearbyIssues'));
const Leaderboard = lazy(() => import('./pages/citizen/Leaderboard'));
const Profile = lazy(() => import('./pages/citizen/Profile'));
const Notifications = lazy(() => import('./pages/citizen/Notifications'));

// Authority pages
const AuthorityDashboard = lazy(() => import('./pages/authority/Dashboard'));
const AuthorityComplaints = lazy(() => import('./pages/authority/Complaints'));
const AuthorityComplaintDetail = lazy(() => import('./pages/authority/ComplaintDetail'));
const AuthorityAnalytics = lazy(() => import('./pages/authority/Analytics'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAuthorities = lazy(() => import('./pages/admin/Authorities'));
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

export default function App() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Initializing CIVIX AI..." />;
  }

  const getDefaultRoute = () => {
    if (!user) return '/';
    switch (userProfile?.role) {
      case 'admin': return '/admin';
      case 'authority': return '/authority';
      default: return '/dashboard';
    }
  };

  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={getDefaultRoute()} /> : <RegisterPage />} />
        <Route path="/authority/login" element={<AuthorityLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Citizen Routes */}
        <Route element={<ProtectedRoute allowedRoles={['citizen', 'admin']} />}>
          <Route path="/dashboard" element={<CitizenDashboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/my-complaints" element={<MyComplaints />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />
          <Route path="/nearby" element={<NearbyIssues />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* Authority Routes */}
        <Route element={<ProtectedRoute allowedRoles={['authority', 'admin']} />}>
          <Route path="/authority" element={<AuthorityDashboard />} />
          <Route path="/authority/complaints" element={<AuthorityComplaints />} />
          <Route path="/authority/complaints/:id" element={<AuthorityComplaintDetail />} />
          <Route path="/authority/analytics" element={<AuthorityAnalytics />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/authorities" element={<AdminAuthorities />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
