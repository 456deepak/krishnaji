import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserLayout from '@/components/layouts/UserLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Withdraw from '@/pages/Withdraw';
import AdminLogin from '@/pages/admin/Login';
import AdminSignup from '@/pages/admin/Signup';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminPayments from '@/pages/admin/Payments';
import AdminTransactions from '@/pages/admin/Transactions';
import TransactionHistory from '@/pages/TransactionHistory';
import PaymentHistory from '@/pages/PaymentHistory';
import { AuthProvider } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Register from './pages/Register';
import Home from './pages/Index';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Refunds from './pages/Refunds';
import Checkout from './pages/Checkout';
import PaymentCallback from './pages/PaymentCallback';

const AppContent = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refunds" element={<Refunds />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Payment Routes */}
              <Route path="/payment/callback" element={
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              } />
              <Route path="/payment/success" element={
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              } />
              <Route path="/payment/failure" element={
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              } />

              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="payments" element={<Checkout />} />
                <Route path="withdraw" element={<Withdraw />} />
                <Route path="payment-history" element={<PaymentHistory />} />
                <Route path="transactions" element={<TransactionHistory />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute admin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="transactions" element={<AdminTransactions />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
