import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AuthService } from "../services/auth.service";

const ROLE_HOME = {
  administrador: "/app/admin",
  docente: "/app/docente",
  padre: "/app/padre",
};

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "administrador",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Crear usuario
        await AuthService.register(formData);
        setSuccess(
          "Usuario creado correctamente. Ahora puedes iniciar sesión.",
        );
        setIsRegistering(false); // Volver a la vista de login
      } else {
        // Iniciar sesión
        const userData = await login(formData.email, formData.password);
        navigate(ROLE_HOME[userData.rol] ?? "/app", { replace: true });
      }
    } catch (err) {
      setError(err.message ?? "Ocurrió un error.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to={ROLE_HOME[user.rol] ?? "/app"} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FaceAttend</h1>
          <p className="text-sm text-gray-500 mt-1">Liceo Santo Domingo</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border px-4 py-3 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border px-4 py-3 border-green-200 bg-green-50">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="administrador">Administrador</option>
                  <option value="docente">Docente</option>
                  <option value="padre">Padre de Familia</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegistering ? "Crear cuenta" : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRegistering
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta de prueba? Regístrate aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}
