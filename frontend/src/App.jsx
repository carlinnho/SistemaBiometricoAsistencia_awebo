import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// Componente temporal para probar que entramos
const DashboardDummy = ({ title }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Bienvenido al Panel de {title}</h1>
    <button
      onClick={() => {
        localStorage.clear();
        window.location.href = "/login";
      }}
      className="mt-4 text-red-500 underline"
    >
      Cerrar Sesión (Test)
    </button>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas temporales para probar la redirección tras el login */}
          <Route
            path="/app/admin"
            element={<DashboardDummy title="Administrador" />}
          />
          <Route
            path="/app/docente"
            element={<DashboardDummy title="Docente" />}
          />
          <Route
            path="/app/padre"
            element={<DashboardDummy title="Padres" />}
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
