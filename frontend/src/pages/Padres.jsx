import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Users,
  X,
  Search,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  activo: true,
};

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div
      className={`fixed bottom-5 right-5 z-200 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
      )}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60">
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
}

export default function Docentes() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [tabEstado, setTabEstado] = useState(true);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDocentes = useCallback(async () => {
    setIsLoading(true);
    try {
      const lista = await UsuariosService.getAll();
      // Filtramos solo los docentes
      setData(
        Array.isArray(lista) ? lista.filter((u) => u.rol === "padre") : [],
      );
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDocentes();
  }, [cargarDocentes]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (
      !form.nombre ||
      !form.apellido ||
      !form.email ||
      (!isEditing && !form.password)
    ) {
      return showToast("error", "Complete los campos obligatorios.");
    }
    const payload = { ...form, rol: "padre" };
    if (isEditing && !payload.password) delete payload.password; // No enviar pass si está vacío al editar

    setIsSaving(true);
    try {
      if (isEditing) await UsuariosService.update(editingId, payload);
      else await UsuariosService.create(payload);

      showToast(
        "success",
        `Docente ${isEditing ? "actualizado" : "registrado"} correctamente.`,
      );
      cerrarModal();
      await cargarDocentes();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const abrirModalEditar = (docente) => {
    setForm({
      nombre: docente.nombre,
      apellido: docente.apellido,
      email: docente.email,
      password: "",
      activo: docente.activo,
    });
    setEditingId(docente.id);
    setIsEditing(true);
    setOpen(true);
  };

  const cerrarModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
    setOpen(false);
  };

  const docentesFiltrados = useMemo(() => {
    return data.filter((d) => {
      const matchEstado = d.activo === tabEstado;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        d.nombre.toLowerCase().includes(term) ||
        d.apellido.toLowerCase().includes(term);
      return matchEstado && matchSearch;
    });
  }, [data, searchTerm, tabEstado]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in relative">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" /> Gestión de Padres de
          Familia
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo Padre de Familia
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setTabEstado(true)}
          className={`px-4 py-2 text-sm rounded-md ${tabEstado ? "bg-white shadow-sm" : "text-gray-500"}`}
        >
          Activos
        </button>
        <button
          onClick={() => setTabEstado(false)}
          className={`px-4 py-2 text-sm rounded-md ${!tabEstado ? "bg-white shadow-sm" : "text-gray-500"}`}
        >
          Inactivos
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar docente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4">Docente</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docentesFiltrados.map((d) => (
              <tr key={d.id}>
                <td className="px-6 py-4 font-medium">
                  {d.nombre} {d.apellido}
                </td>
                <td className="px-6 py-4">{d.email}</td>
                <td className="px-6 py-4">
                  {d.activo ? (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      Activo
                    </span>
                  ) : (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => abrirModalEditar(d)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Editar Docente" : "Nuevo Docente"}
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Correo"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="password"
                  placeholder={
                    isEditing ? "Dejar en blanco para no cambiar" : "Contraseña"
                  }
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />

                {isEditing && (
                  <label className="flex items-center gap-2 text-sm mt-2">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => handleChange("activo", e.target.checked)}
                    />
                    Usuario Activo
                  </label>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                  Guardar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
