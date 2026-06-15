import { useState, useEffect, useMemo } from "react";
import { ClipboardList, Search, Loader2, Calendar, X } from "lucide-react";
import { AsistenciaService } from "../services/asistencia.service";

const getEstadoBadge = (estado) => {
  if (estado === "puntual")
    return "bg-green-50 text-green-700 border-green-200";
  if (estado === "tardanza")
    return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
};

const getRolBadge = (a) => {
  if (a.alumno) return { label: "Alumno", cls: "bg-orange-50 text-orange-700 border-orange-200" };
  const rol = a.usuario?.rol ?? "";
  if (rol === "docente") return { label: "Docente", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: rol || "—", cls: "bg-gray-100 text-gray-500 border-gray-200" };
};

export default function RegistroAsistencia() {
  const [asistencias, setAsistencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroFecha, setFiltroFecha] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    const cargarAsistencias = async () => {
      setIsLoading(true);
      try {
        const data = await AsistenciaService.getAll();
        setAsistencias(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando asistencias:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarAsistencias();
  }, []);

  const asistenciasFiltradas = useMemo(() => {
    return asistencias.filter((a) => {
      const nombre = a.alumno
        ? a.alumno.nombre
        : a.usuario
          ? `${a.usuario.nombre} ${a.usuario.apellido}`
          : "";
      const matchSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const fechaAsistencia = a.fecha.split("T")[0];
      const matchFecha = fechaAsistencia === filtroFecha;
      return matchSearch && matchFecha;
    });
  }, [asistencias, searchTerm, filtroFecha]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">

      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Registro General de Asistencia</h1>
          <p className="text-xs text-gray-400">Consulta entradas, salidas y estados del personal y alumnos.</p>
        </div>
      </div>

      {/* ─── FILTROS ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtro de fecha */}
        <div className="relative w-full sm:w-52">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm rounded-xl"
          />
        </div>
      </div>

      {/* ─── TABLA ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">Persona</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">Entrada</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">Salida</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto h-7 w-7 text-orange-500 mb-2" />
                  <p className="text-sm text-gray-400">Cargando registros...</p>
                </td>
              </tr>
            ) : asistenciasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No hay registros para la fecha seleccionada.</p>
                </td>
              </tr>
            ) : (
              asistenciasFiltradas.map((a) => {
                const nombre = a.alumno
                  ? a.alumno.nombre
                  : a.usuario
                    ? `${a.usuario.nombre} ${a.usuario.apellido}`
                    : "Desconocido";
                const rol = getRolBadge(a);
                return (
                  <tr key={a.id_asistencia} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${rol.cls}`}>
                        {rol.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-sm font-semibold text-gray-700">{a.hora_entrada}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-sm text-gray-400">{a.hora_salida || "--:--:--"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoBadge(a.estado)}`}>
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        {!isLoading && asistenciasFiltradas.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Mostrando <span className="font-semibold text-gray-600">{asistenciasFiltradas.length}</span> registro{asistenciasFiltradas.length !== 1 ? "s" : ""} para el {filtroFecha}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}