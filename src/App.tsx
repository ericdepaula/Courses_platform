import { AdminRoute } from "./components/AdminRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { MyCourses } from "./pages/MyCourses";
import { Explore } from "./pages/Explore";
import { CourseViewer } from "./pages/CourseViewer";
import { Certificates } from "./pages/Certificates";
import { Settings } from "./pages/Settings";
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageCourses } from './pages/admin/ManageCourses';
import { Layout } from "./components/layout/Layout";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Carregando...</div>
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
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
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
            path="/certificates"
            element={
              <ProtectedRoute>
                <Certificates />
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
    </BrowserRouter>
  );
}

export default App;
