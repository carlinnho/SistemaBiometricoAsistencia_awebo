import { fetchApi } from "./api";

export const HorariosPersonalService = {
  getAll: async () => await fetchApi("/horario_usuario"),
  create: async (data) =>
    await fetchApi("/horario_usuario", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) =>
    await fetchApi(`/horario_usuario/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id) => await fetchApi(`/horario_usuario/${id}`, { method: "DELETE" }),
};
