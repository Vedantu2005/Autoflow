import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import MechanicDashboard from './pages/MechanicDashboard';
import AdminDashboard from './pages/AdminDashboard';
import JobDetails from './pages/JobDetails';
import InventoryPage from './pages/InventoryPage';
import AuditLogPage from './pages/AuditLogPage';
import ServiceHistoryPage from './pages/ServiceHistoryPage';
import InvoicesPage from './pages/InvoicesPage';
import VehiclesPage from './pages/VehiclesPage';
import BookingsPage from './pages/BookingsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-sm font-medium">
        Initializing AutoFlow SaaS Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Root Dashboard Router according to User Role
const DynamicDashboard = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SERVICE_ADVISOR':
      return <AdvisorDashboard />;
    case 'MECHANIC':
      return <MechanicDashboard />;
    case 'CUSTOMER':
    default:
      return <CustomerDashboard />;
  }
};

const ServiceJobsRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'MECHANIC') return <MechanicDashboard />;
  return <AdvisorDashboard />;
};

export const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DynamicDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/book-service"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/service-jobs"
              element={
                <ProtectedRoute>
                  <ServiceJobsRoute />
                </ProtectedRoute>
              }
            />

            <Route
              path="/service-jobs/:id"
              element={
                <ProtectedRoute>
                  <JobDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SERVICE_ADVISOR']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/service-history"
              element={
                <ProtectedRoute>
                  <ServiceHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
