import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AuthService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("faceattend_token");
      const storedUser = localStorage.getItem("faceattend_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem("faceattend_token");
      localStorage.removeItem("faceattend_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await AuthService.login(email, password);
    const { access_token, usuario } = data;

    localStorage.setItem("faceattend_token", access_token);
    localStorage.setItem("faceattend_user", JSON.stringify(usuario));

    setToken(access_token);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    if (localStorage.getItem("faceattend_token")) {
      try {
        await AuthService.logout();
      } catch (err) {
        console.warn("Error silenciado en logout:", err);
      }
    }
    localStorage.removeItem("faceattend_token");
    localStorage.removeItem("faceattend_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
