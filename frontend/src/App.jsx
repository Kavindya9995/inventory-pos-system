import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventoryPage from './pages/inventory/InventoryPage';
import BillingPage from './pages/billing/BillingPage';
import BillHistoryPage from './pages/billing/BillHistoryPage';
import BillDetailPage from './pages/billing/BillDetailPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import PriceTagsPage from './pages/tags/PriceTagsPage';
import UsersPage from './pages/users/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#1c1c1f', color: '#f0ede8', border: '1px solid #2e2e32', fontSize: '13px' },
              success: { iconTheme: { primary: '#4ade80', secondary: '#0c0c0e' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#0c0c0e' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="bills" element={<BillHistoryPage />} />
              <Route path="bills/:id" element={<BillDetailPage />} />
              <Route path="tags" element={<PriceTagsPage />} />
              <Route path="users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
