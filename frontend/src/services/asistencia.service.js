import { fetchApi } from "./api";

export const AsistenciaService = {
  // Trae todo el historial de asistencias
  getAll: async () => await fetchApi("/asistencia"),

  // Envía el ID de la persona reconocida para registrar su entrada/salida
  marcar: async (data) =>
    await fetchApi("/asistencia/marcar", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
