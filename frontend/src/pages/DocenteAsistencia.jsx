import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardCheck,
  Loader2,
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AulasService } from "../services/aulas.service";
import { AlumnosService } from "../services/alumnos.service";
import { AsistenciaService } from "../services/asistencia.service";

const ITEMS_PER_PAGE = 10;

export default function DocenteAsistencia() {
  const { user } = useAuth();
  const [miAula, setMiAula] = useState(null);
  const [misAlumnos, setMisAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const hoyFormatoLocal = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aulas, alumnos, asistencias] = await Promise.all([
        AulasService.getAll(),
        AlumnosService.getAll(),
        AsistenciaService.getAll(),
      ]);

      const aulaDelDocente = aulas.find((a) => a.id_docente === user.id);
      setMiAula(aulaDelDocente || null);

      if (aulaDelDocente) {
        const alumnosDelAula = alumnos.filter(
          (al) => al.id_aula === aulaDelDocente.id_aula,
        );

        const hoyIso = new Date(new Date().getTime() - 5 * 3600 * 1000)
          .toISOString()
          .split("T")[0];

        const alumnosConAsistencia = alumnosDelAula.map((al) => {
          const asistenciaHoy = asistencias.find(
            (asis) =>
              asis.id_alumno === al.id_alumno && asis.fecha.startsWith(hoyIso),
          );
          return {
            ...al,
            asistencia: asistenciaHoy || {
              estado: "sin marcar",
              hora_entrada: null,
              hora_salida: null,
            },
          };
        });

        setMisAlumnos(alumnosConAsistencia);
      }
    } catch (error) {
      console.error("Error al cargar la asistencia:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Reset página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const alumnosFiltrados = useMemo(() => {
    return misAlumnos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.DNI.includes(searchTerm),
    );
  }, [misAlumnos, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(alumnosFiltrados.length / ITEMS_PER_PAGE);
  const alumnosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return alumnosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [alumnosFiltrados, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "puntual":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Puntual
          </span>
        );
      case "tardanza":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Tardanza
          </span>
        );
      case "inasistencia":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Falta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5" /> Sin Marcar
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto p-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ClipboardCheck className="h-5 w-5 text-orange-500" />
            Reporte de Asistencia
          </h1>
          <p className="text-xs text-slate-400 mt-1 capitalize flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            {hoyFormatoLocal}
          </p>
        </div>

        {miAula && (
          <div className="flex items-center text-sm rounded-lg overflow-hidden border border-orange-400 shadow-sm">
            <div className="px-4 py-2 bg-orange-500 text-white">
              Aula:{" "}
              <span className="font-bold">
                {miAula.grado} "{miAula.seccion}"
              </span>
            </div>
            <div className="border-l border-orange-400 px-4 py-2 bg-orange-500 text-white">
              Total:{" "}
              <span className="font-bold">
                {misAlumnos.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : !miAula ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 shadow-sm">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin aula asignada</h3>
          <p className="text-sm">No tienes un aula asignada para ver el reporte de asistencia.</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Buscador */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          {/* Tabla con header oscuro igual a la imagen */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider">
                      Nombre del Alumno
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-center">
                      Entrada
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-center">
                      Salida
                    </th>
                    <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                        No se encontraron alumnos.
                      </td>
                    </tr>
                  ) : (
                    alumnosPaginados.map((alumno) => (
                      <tr
                        key={alumno.id_alumno}
                        className="bg-white hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {alumno.DNI}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {alumno.nombre}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-blue-500">
                          {alumno.asistencia.hora_entrada || "--:--"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-slate-400">
                          {alumno.asistencia.hora_salida || "--:--"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getEstadoBadge(alumno.asistencia.estado)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer con paginación — igual a la imagen */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
                <p className="text-xs text-slate-400">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, alumnosFiltrados.length)} de{" "}
                  {alumnosFiltrados.length} alumnos
                </p>

                <div className="flex items-center gap-1">
                  {/* Prev */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Números */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        page === currentPage
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}