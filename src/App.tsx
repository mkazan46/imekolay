import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NewAdminDashboard from "./pages/NewAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Korumalı rota bileşeni
interface ProtectedRouteProps {
  children: ReactNode;
  isAdmin?: boolean;
}

const ProtectedRoute = ({ children, isAdmin = false }: ProtectedRouteProps) => {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const isAdminUser = sessionStorage.getItem('isAdmin') === 'true';
  const location = useLocation();
  
  if (isAdmin) {
    // Admin kontrolü
    return isAdminUser ? (
      <>{children}</>
    ) : (
      <Navigate to="/admin-login" state={{ from: location }} replace />
    );
  }
  
  // Normal öğretmen kontrolü
  return isLoggedIn ? (
    <>{children}</>
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ===== Genel Erişim Sayfaları ===== */}
          {/* Ana Sayfa - Öğretmen Giriş Formu */}
          <Route path="/" element={<Index />} />
          
          {/* 404 Sayfa Bulunamadı */}
          <Route path="*" element={<NotFound />} />
          
          {/* ===== Öğretmen Rotaları ===== */}
          {/* Öğretmen Kontrol Paneli - Giriş yapılmış olmalı */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* ===== Admin Rotaları ===== */}
          {/* Admin Giriş Sayfası */}
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Admin Kontrol Paneli - Admin girişi yapılmış olmalı */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute isAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-admin" 
            element={
              <ProtectedRoute isAdmin>
                <NewAdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
