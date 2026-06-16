import { LogOut, Menu, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ROLE_LABELS = {
  administrador: "Administrador",
  docente: "Docente",
  padre: "Padre de Familia",
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
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 shadow-sm z-30 relative">

      {/* ─── IZQUIERDA ─── */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-base font-bold text-gray-800 hidden sm:block tracking-tight">
          Panel de Control
        </h2>
      </div>

      {/* ─── DERECHA ─── */}
      <div className="flex items-center gap-2">

        {/* Notificaciones */}
        <Link
          to="#"
          className="relative p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <Bell className="h-5 w-5" />
          {/* Punto indicador */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
        </Link>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

        {/* Info de usuario */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex flex-col leading-tight text-right">
            <span className="text-sm font-semibold text-gray-800">
              {user?.nombre} {user?.apellido}
            </span>
            <span className="text-xs text-gray-400">{rolLabel}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-200">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block" />

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}