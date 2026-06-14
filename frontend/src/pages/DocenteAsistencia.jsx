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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AulasService } from "../services/aulas.service";
import { AlumnosService } from "../services/alumnos.service";
import { AsistenciaService } from "../services/asistencia.service"; // <-- IMPORTAMOS EL SERVICIO

export default function DocenteAsistencia() {
  const { user } = useAuth();
  const [miAula, setMiAula] = useState(null);
  const [misAlumnos, setMisAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
        AsistenciaService.getAll(), // <-- TRAEMOS ASISTENCIAS
      ]);

      const aulaDelDocente = aulas.find((a) => a.id_docente === user.id);
      setMiAula(aulaDelDocente || null);

      if (aulaDelDocente) {
        // Filtrar alumnos del aula
        const alumnosDelAula = alumnos.filter(
          (al) => al.id_aula === aulaDelDocente.id_aula,
        );

        // Obtener la fecha de hoy en formato YYYY-MM-DD para buscar en los registros
        const hoyIso = new Date(new Date().getTime() - 5 * 3600 * 1000)
          .toISOString()
          .split("T")[0];

        // Mapear la asistencia real de cada alumno para hoy
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

  const alumnosFiltrados = useMemo(() => {
    return misAlumnos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.DNI.includes(searchTerm),
    );
  }, [misAlumnos, searchTerm]);

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "puntual":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Puntual
          </span>
        );
      case "tardanza":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Tardanza
          </span>
        );
      case "inasistencia":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Falta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5" /> Sin Marcar
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
            <ClipboardCheck className="h-6 w-6 text-blue-600" /> Reporte de
            Asistencia
          </h1>
          <p className="text-sm text-slate-500 mt-1 capitalize flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> {hoyFormatoLocal}
          </p>
        </div>
        {miAula && (
          <div className="bg-white border shadow-sm px-4 py-2 rounded-xl text-sm font-medium text-slate-700 flex gap-4">
            <div>
              Aula:{" "}
              <span className="text-blue-600">
                {miAula.grado} "{miAula.seccion}"
              </span>
            </div>
            <div className="border-l pl-4">
              Total: <span className="text-blue-600">{misAlumnos.length}</span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !miAula ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Sin aula asignada
          </h3>
          <p>No tienes un aula asignada para ver el reporte de asistencia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border flex gap-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alumno por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">DNI</th>
                    <th className="px-6 py-4 font-semibold">
                      Nombre del Alumno
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Entrada
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Salida
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No se encontraron alumnos.
                      </td>
                    </tr>
                  ) : (
                    alumnosFiltrados.map((alumno) => (
                      <tr
                        key={alumno.id_alumno}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {alumno.DNI}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {alumno.nombre}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-blue-600">
                          {alumno.asistencia.hora_entrada || "--:--"}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm text-gray-500">
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
          </div>
        </div>
      )}
    </div>
  );
}
