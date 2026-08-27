import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TemplateManager from './pages/TemplateManager';
import SingleIssue from './pages/SingleIssue';
import BulkIssue from './pages/BulkIssue';
import CertificateList from './pages/CertificateList';
import PublicVerify from './pages/PublicVerify';
import RecipientPortal from './pages/RecipientPortal';
import AiChatbot from './components/AiChatbot';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-column surface-ground">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#123B32',
            border: '1.5px solid #D3DDD7',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(18, 59, 50, 0.15)'
          },
          success: {
            iconTheme: {
              primary: '#123B32',
              secondary: '#FFFFFF'
            }
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF'
            }
          }
        }}
      />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/verify/:code" element={<PublicVerify />} />
          <Route path="/lookup" element={<RecipientPortal />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute>
                <TemplateManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/issue-single"
            element={
              <ProtectedRoute>
                <SingleIssue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/issue-bulk"
            element={
              <ProtectedRoute>
                <BulkIssue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/certificates"
            element={
              <ProtectedRoute>
                <CertificateList />
              </ProtectedRoute>
            }
          />

          {/* Root Fallback */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/admin" : "/login"} replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global AI RAG Chatbot Copilot */}
      <AiChatbot />

      {/* Global Single ConfirmDialog Instance */}
      <ConfirmDialog />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
