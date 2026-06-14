import { fetchApi } from "./api";

export const AlumnosService = {
  getAll: async () => await fetchApi("/alumnos"),
  create: async (data) =>
    await fetchApi("/alumnos", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) =>
    await fetchApi(`/alumnos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id) => await fetchApi(`/alumnos/${id}`, { method: "DELETE" }),
};
