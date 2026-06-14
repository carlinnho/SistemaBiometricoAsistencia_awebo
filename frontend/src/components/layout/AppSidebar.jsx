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
  ClipboardList, // <-- IMPORTADO PARA EL REGISTRO GENERAL
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// ── Definición de ítems por sección ────────────────────────────────────────
const PADRE_ITEMS = [
  { title: "Asistencia de mis hijos", url: "/app/mis-hijos", icon: Clock },
];

const DOCENTE_ITEMS = [
  { title: "Mi Aula", url: "/app/mi-aula", icon: GraduationCap },
  {
    title: "Asistencia de Alumnos",
    url: "/app/tomar-asistencia",
    icon: ScanFace,
  },
];

const ADMIN_ITEMS = [
  { title: "Quiosco Principal", url: "/app/quiosco", icon: MonitorPlay },
  { title: "Reg. Asistencia", url: "/app/asistencias", icon: ClipboardList }, // <-- NUEVA PESTAÑA AÑADIDA
  { title: "Docentes", url: "/app/docentes", icon: Users },
  { title: "Padres de Familia", url: "/app/padres", icon: UserCircle },
  { title: "Aulas", url: "/app/aulas", icon: BookOpen },
  { title: "Horarios", url: "/app/horarios", icon: CalendarClock },
  {
    title: "Horarios Personal",
    url: "/app/horarios-personal",
    icon: CalendarClock,
  },
  { title: "Alumnos", url: "/app/alumnos", icon: GraduationCap },
  { title: "Configuración", url: "/app/configuracion", icon: Settings },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

function NavSection({ label, items }) {
  return (
    <div>
      <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink key={item.title} to={item.url} end className={linkClass}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar({ isOpen }) {
  const { user } = useAuth();

  const rol = user?.rol ?? "";
  const showAdmin = rol === "administrador";
  const showDocente = rol === "docente";
  const showPadre = rol === "padre";

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 w-64 shrink-0 flex flex-col
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static fixed inset-y-0 left-0 z-40
      `}
    >
      <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-gray-900">FaceAttend</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            Liceo Santo Domingo
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {showPadre && (
          <NavSection label="Panel de Padres" items={PADRE_ITEMS} />
        )}
        {showDocente && (
          <NavSection label="Panel Docente" items={DOCENTE_ITEMS} />
        )}
        {showAdmin && <NavSection label="Administración" items={ADMIN_ITEMS} />}
      </div>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">© 2026 FaceAttend</p>
      </div>
    </aside>
  );
}
