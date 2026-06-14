import { fetchApi } from "./api";

export const UsuariosService = {
  getAll: async () => await fetchApi("/usuarios"),
  create: async (data) =>
    await fetchApi("/usuarios", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) =>
    await fetchApi(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: async (id) => await fetchApi(`/usuarios/${id}`, { method: "DELETE" }),
};
