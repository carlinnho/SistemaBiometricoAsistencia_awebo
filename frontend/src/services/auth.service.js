import { fetchApi } from "./api";

export const AuthService = {
  login: async (email, password) => {
    return await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Agregado temporalmente para crear usuarios de prueba desde el login
  register: async (userData) => {
    return await fetchApi("/usuarios", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return await fetchApi("/auth/logout", {
      method: "POST",
    });
  },
};
