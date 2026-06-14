import { useState, useEffect, useCallback } from "react";
import { Users, GraduationCap, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AulasService } from "../services/aulas.service";
import { AlumnosService } from "../services/alumnos.service";

export default function DocenteAula() {
  const { user } = useAuth();
  const [miAula, setMiAula] = useState(null);
  const [misAlumnos, setMisAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Traer todas las aulas y alumnos
      const [aulas, alumnos] = await Promise.all([
        AulasService.getAll(),
        AlumnosService.getAll(),
      ]);

      // 2. Buscar el aula donde el id_docente sea igual al ID del usuario actual
      const aulaDelDocente = aulas.find((a) => a.id_docente === user.id);
      setMiAula(aulaDelDocente || null);

      // 3. Si tiene un aula, filtramos los alumnos que pertenecen a esa aula
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

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600" /> Mi Aula Asignada
        </h1>
        {miAula && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2 font-medium">
            <BookOpen className="h-5 w-5" />
            {miAula.grado} - "{miAula.seccion}"
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !miAula ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Sin aula asignada
          </h3>
          <p>El administrador aún no te ha asignado como tutor de un aula.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">
              Lista de Estudiantes
            </h3>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
              Total: {misAlumnos.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b">
                <tr>
                  <th className="px-6 py-4 text-gray-500 font-semibold">DNI</th>
                  <th className="px-6 py-4 text-gray-500 font-semibold">
                    Nombre del Alumno
                  </th>
                  <th className="px-6 py-4 text-gray-500 font-semibold">
                    Apoderado Principal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {misAlumnos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No hay alumnos registrados en esta aula todavía.
                    </td>
                  </tr>
                ) : (
                  misAlumnos.map((alumno) => (
                    <tr key={alumno.id_alumno} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-500">
                        {alumno.DNI}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {alumno.nombre}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {alumno.padres?.length > 0
                          ? `${alumno.padres[0].nombre} ${alumno.padres[0].apellido}`
                          : "Sin apoderado vinculado"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
