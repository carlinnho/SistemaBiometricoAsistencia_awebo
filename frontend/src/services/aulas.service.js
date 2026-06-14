import { fetchApi } from "./api";

export const AulasService = {
  getAll: async () => await fetchApi("/aulas"),
  create: async (data) =>
    await fetchApi("/aulas", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) =>
    await fetchApi(`/aulas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id) => await fetchApi(`/aulas/${id}`, { method: "DELETE" }),
};
