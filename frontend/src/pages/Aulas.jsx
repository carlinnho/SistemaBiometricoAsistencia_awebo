import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  Search,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { AulasService } from "../services/aulas.service";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", grado: "", seccion: "", id_docente: "" };

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

export default function Aulas() {
  const [data, setData] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listaAulas, listaUsuarios] = await Promise.all([
        AulasService.getAll(),
        UsuariosService.getAll(),
      ]);
      setData(Array.isArray(listaAulas) ? listaAulas : []);
      setDocentes(
        Array.isArray(listaUsuarios)
          ? listaUsuarios.filter((u) => u.rol === "docente" && u.activo)
          : [],
      );
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre || !form.grado || !form.seccion || !form.id_docente) {
      return showToast("error", "Complete todos los campos obligatorios.");
    }
    const payload = { ...form, id_docente: Number(form.id_docente) };

    setIsSaving(true);
    try {
      if (isEditing) await AulasService.update(editingId, payload);
      else await AulasService.create(payload);

      showToast(
        "success",
        `Aula ${isEditing ? "actualizada" : "registrada"} correctamente.`,
      );
      cerrarModal();
      await cargarDatos();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const abrirModalEditar = (aula) => {
    setForm({
      nombre: aula.nombre,
      grado: aula.grado,
      seccion: aula.seccion,
      id_docente: aula.id_docente,
    });
    setEditingId(aula.id_aula);
    setIsEditing(true);
    setOpen(true);
  };

  const cerrarModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
    setOpen(false);
  };

  const aulasFiltradas = useMemo(() => {
    return data.filter((d) =>
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in relative">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" /> Gestión de Aulas
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nueva Aula
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aula por nombre..."
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
              <th className="px-6 py-4">Nombre del Aula</th>
              <th className="px-6 py-4">Grado y Sección</th>
              <th className="px-6 py-4">Docente a Cargo</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <Loader2 className="animate-spin mx-auto h-5 w-5 text-gray-400" />
                </td>
              </tr>
            ) : (
              aulasFiltradas.map((d) => (
                <tr key={d.id_aula}>
                  <td className="px-6 py-4 font-medium">{d.nombre}</td>
                  <td className="px-6 py-4">
                    {d.grado} - "{d.seccion}"
                  </td>
                  <td className="px-6 py-4">
                    {d.docente
                      ? `${d.docente.nombre} ${d.docente.apellido}`
                      : "Sin asignar"}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Editar Aula" : "Nueva Aula"}
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre del Aula (Ej. Sala 1)"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Grado (Ej. 5to Primaria)"
                  value={form.grado}
                  onChange={(e) => handleChange("grado", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Sección (Ej. A)"
                  value={form.seccion}
                  onChange={(e) => handleChange("seccion", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />

                <select
                  value={form.id_docente}
                  onChange={(e) => handleChange("id_docente", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Seleccionar Docente...</option>
                  {docentes.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nombre} {doc.apellido}
                    </option>
                  ))}
                </select>
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
