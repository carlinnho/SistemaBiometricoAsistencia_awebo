import { fetchApi } from "./api";

export const HorariosService = {
  getAll: async () => await fetchApi("/horarios"),
  create: async (data) =>
    await fetchApi("/horarios", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) =>
    await fetchApi(`/horarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id) => await fetchApi(`/horarios/${id}`, { method: "DELETE" }),
};
