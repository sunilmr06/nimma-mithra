import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Common / Profile Pages
import ProfilePage from './pages/common/ProfilePage';

// Student / Feature Pages
import StudentDashboard from './pages/student/StudentDashboard';
import SubmitComplaintPage from './pages/student/SubmitComplaintPage';
import MyComplaintsPage from './pages/student/MyComplaintsPage';
import CampusComplaintsPage from './pages/student/CampusComplaintsPage';
import ComplaintDetailPage from './pages/student/ComplaintDetailPage';
import IssueTrackerPage from './pages/student/IssueTrackerPage';
import PublicFeedPage from './pages/student/PublicFeedPage';
import PublicFeedbackPage from './pages/student/PublicFeedbackPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import UsersPage from './pages/admin/UsersPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';

// Protected Route Guard
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted">
        Verifying authorization...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/student" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Root Redirector
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted">
        Loading Nimma Mithra...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Common Shared Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/feed"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <PublicFeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <PublicFeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/feedback"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <PublicFeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <PublicFeedbackPage />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/tracker"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <IssueTrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/report"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubmitComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-complaints"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/campus-feed"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CampusComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
                  <ComplaintDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminComplaintsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Protected Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
