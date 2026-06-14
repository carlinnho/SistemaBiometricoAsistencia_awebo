import { Navigate, Outlet } from "react-router-dom";
// Usamos ruta relativa en lugar de @/ para evitar errores de Vite
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute({
  allowedRoles,
  redirectTo = "/app", // Cambiado el default para FaceAttend
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-500">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
