import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  UserCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AlumnosService } from "../services/alumnos.service";
import { AsistenciaService } from "../services/asistencia.service"; // <-- IMPORTAMOS

export default function PadreDashboard() {
  const { user } = useAuth();
  const [misHijos, setMisHijos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [todosLosAlumnos, asistencias] = await Promise.all([
        AlumnosService.getAll(),
        AsistenciaService.getAll(),
      ]);

      const hijosDelPadre = todosLosAlumnos.filter((alumno) =>
        alumno.padres?.some((padre) => padre.id === user.id),
      );

      const hoyIso = new Date(new Date().getTime() - 5 * 3600 * 1000)
        .toISOString()
        .split("T")[0];

      // Cruzamos cada hijo con su asistencia de hoy
      const hijosConAsistencia = hijosDelPadre.map((hijo) => {
        const asisHoy = asistencias.find(
          (a) => a.id_alumno === hijo.id_alumno && a.fecha.startsWith(hoyIso),
        );
        return { ...hijo, asistenciaHoy: asisHoy || null };
      });

      setMisHijos(hijosConAsistencia);
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
            Comunícate con la administración para vincular tu cuenta con tus
            hijos.
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

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-5">
                  <Calendar className="h-4 w-4 text-gray-400" /> Aula:{" "}
                  <span className="font-medium">
                    {hijo.aula?.grado || "N/A"} "{hijo.aula?.seccion || ""}"
                  </span>
                </div>

                {/* TARJETA DE ASISTENCIA REAL */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                    Asistencia de Hoy
                  </h4>

                  {hijo.asistenciaHoy ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-md ${hijo.asistenciaHoy.estado === "puntual" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                          >
                            {hijo.asistenciaHoy.estado === "puntual" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            Entrada
                          </span>
                        </div>
                        <span className="font-mono text-sm text-blue-600 font-bold">
                          {hijo.asistenciaHoy.hora_entrada}
                        </span>
                      </div>

                      {hijo.asistenciaHoy.hora_salida ? (
                        <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              Salida
                            </span>
                          </div>
                          <span className="font-mono text-sm text-slate-600 font-bold">
                            {hijo.asistenciaHoy.hora_salida}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-slate-400 py-1 font-medium">
                          Salida no registrada aún
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        Aún no ha ingresado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
