import { useState, useEffect, useMemo } from "react";
import { ClipboardList, Search, Loader2, Calendar } from "lucide-react";
import { AsistenciaService } from "../services/asistencia.service";

export default function RegistroAsistencia() {
  const [asistencias, setAsistencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroFecha, setFiltroFecha] = useState(
    new Date().toISOString().split("T")[0],
  ); // Fecha de hoy por defecto

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
      // Determinar el nombre a buscar (Alumno o Usuario)
      const nombre = a.alumno
        ? a.alumno.nombre
        : a.usuario
          ? `${a.usuario.nombre} ${a.usuario.apellido}`
          : "";
      const matchSearch = nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Filtrar por fecha exacta (el backend devuelve a.fecha como YYYY-MM-DD o ISO)
      const fechaAsistencia = a.fecha.split("T")[0];
      const matchFecha = fechaAsistencia === filtroFecha;

      return matchSearch && matchFecha;
    });
  }, [asistencias, searchTerm, filtroFecha]);

  const getEstadoColor = (estado) => {
    if (estado === "puntual") return "text-emerald-600 bg-emerald-50";
    if (estado === "tardanza") return "text-amber-600 bg-amber-50";
    return "text-rose-600 bg-rose-50";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-blue-600" /> Registro General
          de Asistencia
        </h1>
      </div>

      <div className="bg-white p-4 rounded-xl border flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">Persona</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Rol</th>
              <th className="px-6 py-4 font-semibold text-center text-gray-600">
                Entrada
              </th>
              <th className="px-6 py-4 font-semibold text-center text-gray-600">
                Salida
              </th>
              <th className="px-6 py-4 font-semibold text-center text-gray-600">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-blue-600" />
                </td>
              </tr>
            ) : asistenciasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No hay registros para la fecha seleccionada.
                </td>
              </tr>
            ) : (
              asistenciasFiltradas.map((a) => (
                <tr key={a.id_asistencia} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {a.alumno
                      ? a.alumno.nombre
                      : a.usuario
                        ? `${a.usuario.nombre} ${a.usuario.apellido}`
                        : "Desconocido"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 uppercase text-xs font-bold tracking-wider">
                    {a.alumno ? "Alumno" : a.usuario ? a.usuario.rol : ""}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-medium">
                    {a.hora_entrada}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-gray-500 font-medium">
                    {a.hora_salida || "--:--:--"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(a.estado)}`}
                    >
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
