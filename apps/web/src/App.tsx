import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import QRLogin from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./hooks/useAuth";
import Loading from "./components/Loading";

function ProtectedRoute({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading message="Проверка авторизации..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <QRLogin />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
