import { LogOut, Menu, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ROLE_LABELS = {
  administrador: "Administrador",
  docente: "Docente",
  padre: "Padre de Familia",
};

const ROLE_BADGE = {
  administrador: "bg-purple-100 text-purple-700",
  docente: "bg-blue-100 text-blue-700",
  padre: "bg-amber-100 text-amber-700",
};

export function AppHeader({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials =
    user?.nombre && user?.apellido
      ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
      : "??";

  const rolLabel = ROLE_LABELS[user?.rol] ?? user?.rol ?? "—";

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 sm:px-6 shadow-sm z-30 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
          Panel de Control
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="#"
          className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-2"
        >
          <Bell className="h-5 w-5" />
        </Link>

        <div className="hidden sm:flex items-center gap-2.5 border-l pl-4 border-gray-200">
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-900">
              {user?.nombre} {user?.apellido}
            </span>
            <span className="text-xs text-gray-400">{rolLabel}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 ml-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
