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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AulasService } from "../services/aulas.service";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", grado: "", seccion: "", id_docente: "" };

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div
      className={`fixed bottom-5 right-5 z-[200] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [aulaAEliminar, setAulaAEliminar] = useState(null);

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

  const handleEliminar = async () => {
    if (!aulaAEliminar) return;
    setIsDeleting(true);
    try {
      await AulasService.remove(aulaAEliminar.id_aula);
      showToast("success", "Aula eliminada correctamente.");
      setAulaAEliminar(null);
      await cargarDatos();
    } catch (err) {
      showToast("error", "No se pudo eliminar el aula: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const abrirModalEditar = (aula) => {
    setForm({
      nombre: aula.nombre,
      grado: aula.grado,
      seccion: aula.seccion,
      // ─── CORRECCIÓN AQUÍ: Leemos el ID del docente desde el objeto anidado ───
      id_docente: aula.docente?.id || aula.id_docente || "",
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

      <div className="bg-white p-4 rounded-xl border flex gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aula por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Nombre del Aula
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Grado y Sección
              </th>
              <th className="px-6 py-4 font-semibold text-gray-600">
                Docente a Cargo
              </th>
              <th className="px-6 py-4 font-semibold text-center text-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-blue-600" />
                </td>
              </tr>
            ) : aulasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No se encontraron aulas.
                </td>
              </tr>
            ) : (
              aulasFiltradas.map((d) => (
                <tr
                  key={d.id_aula}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {d.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.grado} - "{d.seccion}"
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.docente ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {d.docente.nombre} {d.docente.apellido}
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-bold">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => abrirModalEditar(d)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded-md transition-colors"
                      title="Editar Aula"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setAulaAEliminar(d)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-md transition-colors"
                      title="Eliminar Aula"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ─── */}
      {aulaAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar Aula?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de eliminar el aula{" "}
                <strong>{aulaAEliminar.nombre}</strong>. Se eliminarán sus
                horarios asociados, pero los alumnos quedarán sin aula asignada.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAulaAEliminar(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ─── MODAL DE CREAR / EDITAR ─── */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {isEditing ? "Editar Aula" : "Nueva Aula"}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Nombre del Aula
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Sala 1"
                    value={form.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Grado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 5to Primaria"
                      value={form.grado}
                      onChange={(e) => handleChange("grado", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Sección
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. A"
                      value={form.seccion}
                      onChange={(e) => handleChange("seccion", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Docente a cargo
                  </label>
                  <select
                    value={form.id_docente}
                    onChange={(e) => handleChange("id_docente", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="" disabled>
                      Seleccionar Docente...
                    </option>
                    {docentes.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.nombre} {doc.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={cerrarModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                  Guardar Aula
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
