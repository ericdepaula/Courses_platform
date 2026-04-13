import { AdminRoute } from "./components/AdminRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { CourseGroup } from "./pages/CourseGroup";
import { CourseViewer } from "./pages/CourseViewer";
import { Settings } from "./pages/Settings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ManageCourses } from "./pages/admin/ManageCourses";
import { Layout } from "./components/layout/Layout";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { Analytics } from "@vercel/analytics/react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <LoadingScreen
          label="Preparando acesso"
        />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard>
                <Auth />
              </AuthGuard>
            }
          />
          {/* ROTAS DE ADMINISTRADOR */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <Layout title="Admin Dashboard">
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cursos"
            element={
              <AdminRoute>
                <Layout title="Manage Courses">
                  <ManageCourses />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/explore"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CourseViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course-group/:groupName"
            element={
              <ProtectedRoute>
                <CourseGroup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
