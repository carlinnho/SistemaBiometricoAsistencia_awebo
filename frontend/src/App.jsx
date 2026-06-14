import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

// Importación de Páginas
import Login from "./pages/Login";
import Docentes from "./pages/Docentes";
import Padres from "./pages/Padres";
import Aulas from "./pages/Aulas";
import Horarios from "./pages/Horarios";
import Alumnos from "./pages/Alumnos";

// Nuevas Páginas por Rol y Quiosco
import DocenteAula from "./pages/DocenteAula";
import DocenteAsistencia from "./pages/DocenteAsistencia";
import PadreDashboard from "./pages/PadreDashboard";
import QuioscoAsistencia from "./pages/QuioscoAsistencia";
import HorariosPersonal from "./pages/HorariosPersonal";
import RegistroAsistencia from "./pages/RegistroAsistencia"; // <-- IMPORTACIÓN AÑADIDA

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* ── RUTAS DE ADMINISTRADOR ── */}
              <Route
                element={<ProtectedRoute allowedRoles={["administrador"]} />}
              >
                <Route path="/app/docentes" element={<Docentes />} />
                <Route path="/app/padres" element={<Padres />} />
                <Route path="/app/aulas" element={<Aulas />} />
                <Route path="/app/horarios" element={<Horarios />} />
                <Route path="/app/alumnos" element={<Alumnos />} />
                <Route
                  path="/app/horarios-personal"
                  element={<HorariosPersonal />}
                />
                <Route path="/app/quiosco" element={<QuioscoAsistencia />} />
                <Route
                  path="/app/asistencias"
                  element={<RegistroAsistencia />}
                />{" "}
                {/* <-- NUEVA RUTA */}
              </Route>

              {/* ── RUTAS DE DOCENTE ── */}
              <Route element={<ProtectedRoute allowedRoles={["docente"]} />}>
                <Route path="/app/mi-aula" element={<DocenteAula />} />
                <Route
                  path="/app/tomar-asistencia"
                  element={<DocenteAsistencia />}
                />
              </Route>

              {/* ── RUTAS DE PADRE ── */}
              <Route element={<ProtectedRoute allowedRoles={["padre"]} />}>
                <Route path="/app/mis-hijos" element={<PadreDashboard />} />
              </Route>

              {/* ── RUTA FALLBACK (404 Interno) ── */}
              <Route
                path="/app/*"
                element={
                  <div className="p-8 text-center text-gray-500">
                    Página en construcción o no encontrada.
                  </div>
                }
              />
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
