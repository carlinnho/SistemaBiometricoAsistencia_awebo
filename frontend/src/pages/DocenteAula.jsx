import { useState, useEffect, useCallback } from "react";
import {
  Users,
  GraduationCap,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AulasService } from "../services/aulas.service";
import { AlumnosService } from "../services/alumnos.service";

const PAGE_SIZE = 10;

/* ─── PAGINATION ─── */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const btnBase =
    "h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors";

  return (
    <div className="relative px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
      <p className="text-xs text-gray-400">
        Mostrando{" "}
        <span className="font-semibold text-gray-600">{from}–{to}</span>{" "}
        de{" "}
        <span className="font-semibold text-gray-600">{totalItems}</span>{" "}
        alumno{totalItems !== 1 ? "s" : ""}
      </p>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="h-8 w-8 flex items-center justify-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${
                p === currentPage
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── COLOR PRINCIPAL ─── */
const NARANJA = "#FF8C00";

/* ─── COMPONENTE PRINCIPAL ─── */
export default function DocenteAula() {
  const { user } = useAuth();
  const [miAula, setMiAula] = useState(null);
  const [misAlumnos, setMisAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aulas, alumnos] = await Promise.all([
        AulasService.getAll(),
        AlumnosService.getAll(),
      ]);

      const aulaDelDocente = aulas.find((a) => a.id_docente === user.id);
      setMiAula(aulaDelDocente || null);

      if (aulaDelDocente) {
        const alumnosDelAula = alumnos.filter(
          (al) => al.id_aula === aulaDelDocente.id_aula,
        );
        setMisAlumnos(alumnosDelAula);
      }
    } catch (error) {
      console.error("Error al cargar el aula:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const totalPages = Math.ceil(misAlumnos.length / PAGE_SIZE);
  const paginatedAlumnos = misAlumnos.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">

      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: NARANJA }}
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Mi Aula Asignada</h1>
            <p className="text-xs text-gray-400">Lista de estudiantes bajo tu tutoría.</p>
          </div>
        </div>
        {miAula && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl"
            style={{ backgroundColor: NARANJA }}
          >
            <BookOpen className="h-4 w-4" />
            {miAula.grado} — "{miAula.seccion}"
          </div>
        )}
      </div>

      {/* ─── CONTENIDO ─── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: NARANJA }} />
        </div>
      ) : !miAula ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">
            El administrador aún no te ha asignado como tutor de un aula.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

          {/* ─── Barra superior gris oscuro ─── */}
          <div
            className="px-6 py-3.5 border-b border-gray-700 flex items-center justify-between"
            style={{ backgroundColor: "#2d3748" }}
          >
            <span className="text-sm font-semibold text-gray-200">Lista de Estudiantes</span>
            <span
              className="px-2.5 py-1 text-white text-xs font-bold rounded-full"
              style={{ backgroundColor: NARANJA }}
            >
              Total: {misAlumnos.length}
            </span>
          </div>

          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ backgroundColor: NARANJA }}>
                <th className="px-6 py-3.5 text-xs font-bold text-white uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3.5 text-xs font-bold text-white uppercase tracking-wider">Nombre del Alumno</th>
                <th className="px-6 py-3.5 text-xs font-bold text-white uppercase tracking-wider">Apoderado Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedAlumnos.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      No hay alumnos registrados en esta aula todavía.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAlumnos.map((alumno) => (
                  <tr key={alumno.id_alumno} className="hover:bg-orange-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 tracking-wider">
                      {alumno.DNI}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {alumno.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {alumno.padres?.length > 0
                        ? `${alumno.padres[0].nombre} ${alumno.padres[0].apellido}`
                        : <span className="text-gray-300">Sin apoderado vinculado</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ─── PAGINACIÓN ─── */}
          {misAlumnos.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={misAlumnos.length}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
      )}
    </div>
  );
}