import { useState, useEffect, useCallback } from "react";
import { Clock, UserCircle, Loader2, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AlumnosService } from "../services/alumnos.service";

export default function PadreDashboard() {
  const { user } = useAuth();
  const [misHijos, setMisHijos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const todosLosAlumnos = await AlumnosService.getAll();

      // Filtramos los alumnos comprobando si en su arreglo de padres, alguno tiene el ID del usuario logueado
      const hijosDelPadre = todosLosAlumnos.filter((alumno) =>
        alumno.padres?.some((padre) => padre.id === user.id),
      );

      setMisHijos(hijosDelPadre);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <UserCircle className="h-6 w-6 text-blue-600" /> Mis Hijos
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : misHijos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500 shadow-sm">
          <UserCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Sin hijos vinculados
          </h3>
          <p>
            Comunícate con la administración del colegio para vincular tu cuenta
            con tus hijos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {misHijos.map((hijo) => (
            <div
              key={hijo.id_alumno}
              className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                    {hijo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {hijo.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">DNI: {hijo.DNI}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Aula:{" "}
                  <span className="font-medium">
                    {hijo.aula?.grado || "N/A"} "{hijo.aula?.seccion || ""}"
                  </span>
                </div>

                {/* Esta sección se alimentará con los datos de asistencia más adelante */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Asistencia de
                    Hoy
                  </div>
                  <div className="text-xs text-gray-500">
                    Módulo de asistencia en construcción. Pronto podrás ver el
                    estado aquí.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
