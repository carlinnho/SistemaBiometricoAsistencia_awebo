import { useState, useEffect, useCallback } from "react";
import {
  UserCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AlumnosService } from "../services/alumnos.service";
import { AsistenciaService } from "../services/asistencia.service";

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
          <UserCircle className="h-6 w-6 text-orange-500" /> Mis Hijos
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : misHijos.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-500 shadow-sm">
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
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ borderLeft: "4px solid #f97316" }}
            >
              {/* Encabezado */}
              <div className="p-5 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-11 w-11 rounded-full bg-orange-50 text-orange-500 border-2 border-orange-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {hijo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                      {hijo.nombre}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      DNI: {hijo.DNI}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-medium px-3 py-1 rounded-full">
                  <Calendar className="h-3 w-3" />
                  {hijo.aula?.grado || "N/A"} "{hijo.aula?.seccion || ""}"
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Asistencia */}
              <div className="p-5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Asistencia de Hoy
                </p>

                {hijo.asistenciaHoy ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            hijo.asistenciaHoy.estado === "puntual"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {hijo.asistenciaHoy.estado === "puntual" ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                          Entrada
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-blue-500">
                        {hijo.asistenciaHoy.hora_entrada}
                      </span>
                    </div>

                    {hijo.asistenciaHoy.hora_salida ? (
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-600">
                            Salida
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-slate-500">
                          {hijo.asistenciaHoy.hora_salida}
                        </span>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-slate-400 font-medium py-1">
                        Salida no registrada aún
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-4 py-1.5 rounded-full">
                      Aún no ha ingresado
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}