import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ReportItemPage } from './pages/ReportItemPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { MyReportsPage } from './pages/MyReportsPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RecoveryHistoryPage } from './pages/RecoveryHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/browse" element={<BrowseItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/recovery" element={<RecoveryHistoryPage />} />

            {/* Student & Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPERADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPERADMIN']}>
                  <ReportItemPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-reports"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-claims"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyClaimsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPERADMIN']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPERADMIN']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Admin & Superadmin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Super Admin Exclusive Route */}
            <Route
              path="/superadmin/*"
              element={
                <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
