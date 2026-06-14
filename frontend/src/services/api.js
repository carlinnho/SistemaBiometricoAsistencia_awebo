const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem("faceattend_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que el backend esté encendido.",
    );
  }

  if (response.status === 401) {
    localStorage.removeItem("faceattend_token");
    localStorage.removeItem("faceattend_user");
    window.dispatchEvent(new Event("auth-expired"));
    throw new Error("Sesión expirada o credenciales inválidas.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = data?.message ?? "Ocurrió un error inesperado.";
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(". ")
      : String(rawMessage);
    throw new Error(message);
  }

  return data;
}
