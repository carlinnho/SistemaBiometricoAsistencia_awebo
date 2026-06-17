import {
  Clock,
  Users,
  ShieldCheck,
  Settings,
  GraduationCap,
  UserCircle,
  BookOpen,
  CalendarClock,
  ScanFace,
  MonitorPlay,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PADRE_ITEMS = [
  { title: "Asistencia de mis hijos", url: "/app/mis-hijos", icon: Clock },
];

const DOCENTE_ITEMS = [
  { title: "Mi Aula", url: "/app/mi-aula", icon: GraduationCap },
  { title: "Asistencia de Alumnos", url: "/app/tomar-asistencia", icon: ScanFace },
];

const ADMIN_ITEMS = [
  { title: "Quiosco Principal", url: "/app/quiosco", icon: MonitorPlay },
  { title: "Reg. Asistencia", url: "/app/asistencias", icon: ClipboardList },
  { title: "Docentes", url: "/app/docentes", icon: Users },
  { title: "Padres de Familia", url: "/app/padres", icon: UserCircle },
  { title: "Aulas", url: "/app/aulas", icon: BookOpen },
  { title: "Horarios", url: "/app/horarios", icon: CalendarClock },
  { title: "Horarios Personal", url: "/app/horarios-personal", icon: CalendarClock },
  { title: "Alumnos", url: "/app/alumnos", icon: GraduationCap },
  { title: "Configuración", url: "/app/configuracion", icon: Settings },
];

function NavItem({ item }) {
  return (
    <NavLink
      to={item.url}
      end
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-orange-500 text-white shadow-md shadow-orange-200"
            : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
              isActive
                ? "bg-white/20"
                : "bg-gray-100 group-hover:bg-orange-100"
            }`}
          >
            <item.icon
              className={`h-3.5 w-3.5 ${
                isActive ? "text-white" : "text-gray-500 group-hover:text-orange-500"
              }`}
            />
          </span>
          <span>{item.title}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
          )}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, items }) {
  return (
    <div>
      <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar({ isOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rol = user?.rol ?? "";
  const showAdmin = rol === "administrador";
  const showDocente = rol === "docente";
  const showPadre = rol === "padre";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`
        bg-white border-r border-gray-100 w-72 shrink-0 flex flex-col h-screen fixed md:sticky top-0 left-0 z-40
        transition-transform duration-300 shadow-sm
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* ─── LOGO ─── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-200">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-gray-900 tracking-tight">FaceAttend</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            Liceo Santo Domingo
          </span>
        </div>
      </div>

      {/* ─── NAV ─── */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {showPadre && <NavSection label="Panel de Padres" items={PADRE_ITEMS} />}
        {showDocente && <NavSection label="Panel Docente" items={DOCENTE_ITEMS} />}
        {showAdmin && <NavSection label="Administración" items={ADMIN_ITEMS} />}
      </div>

      {/* ─── FOOTER DE USUARIO ─── */}
      <div className="p-3 border-t border-gray-100 shrink-0">
        {/* Info de usuario (sin avatar) */}
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-bold text-gray-800 truncate">
            {user?.nombre} {user?.apellido}
          </p>
          <p className="text-[11px] text-gray-400 capitalize truncate mt-0.5">{user?.rol}</p>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>

        <p className="text-[10px] text-gray-300 text-center mt-1">© 2026 FaceAttend</p>
      </div>
    </aside>
  );
}