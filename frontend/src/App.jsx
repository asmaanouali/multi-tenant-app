import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage.jsx';
import CalendarPage from './pages/CalendarPage';
import CatalogsPage from './pages/CatalogsPage';
import EventsPage from './pages/EventsPage';
import SettingsPage from './pages/SettingsPage';
import OrganizationsPage from './pages/OrganizationsPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalogs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CatalogsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
  path="/organizations"
  element={
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <Layout>
        <OrganizationsPage />
      </Layout>
    </ProtectedRoute>
  }
/>

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EventsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute >
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
              
            

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;