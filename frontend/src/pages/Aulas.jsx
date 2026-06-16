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

/* ─── TOAST ─── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div
      className={`fixed bottom-5 right-5 z-[200] flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm border ${
        isError
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-orange-50 border-orange-200 text-orange-800"
      }`}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
      )}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body,
  );
}

/* ─── BADGE DE DOCENTE ─── */
function DocenteBadge({ docente }) {
  if (!docente)
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
        Sin asignar
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
      {docente.nombre} {docente.apellido}
    </span>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
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

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre || !form.grado || !form.seccion || !form.id_docente)
      return showToast("error", "Complete todos los campos obligatorios.");

    const payload = { ...form, id_docente: Number(form.id_docente) };
    setIsSaving(true);
    try {
      if (isEditing) await AulasService.update(editingId, payload);
      else await AulasService.create(payload);
      showToast("success", `Aula ${isEditing ? "actualizada" : "registrada"} correctamente.`);
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

  const aulasFiltradas = useMemo(
    () => data.filter((d) => d.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
    [data, searchTerm],
  );

  /* ─── INPUT / SELECT CLASSNAMES ─── */
  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm";

  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Icono con fondo naranja al estilo FaceAttend */}
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Gestión de Aulas</h1>
            <p className="text-xs text-gray-400">Administra las aulas y sus docentes asignados.</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nueva Aula
        </button>
      </div>

      {/* ─── BARRA DE BÚSQUEDA ─── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar aula por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm rounded-xl"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── TABLA ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Nombre del Aula
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Grado y Sección
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Docente a Cargo
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto h-7 w-7 text-orange-500 mb-2" />
                  <p className="text-sm text-gray-400">Cargando aulas...</p>
                </td>
              </tr>
            ) : aulasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No se encontraron aulas.</p>
                </td>
              </tr>
            ) : (
              aulasFiltradas.map((d) => (
                <tr key={d.id_aula} className="hover:bg-orange-50/40 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800">{d.nombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                      {d.grado}
                      <span className="text-gray-300">·</span>
                      Sec. {d.seccion}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <DocenteBadge docente={d.docente} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => abrirModalEditar(d)}
                        title="Editar Aula"
                        className="p-2 rounded-xl text-orange-500 hover:bg-orange-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAulaAEliminar(d)}
                        title="Eliminar Aula"
                        className="p-2 rounded-xl text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer con conteo */}
        {!isLoading && aulasFiltradas.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Mostrando <span className="font-semibold text-gray-600">{aulasFiltradas.length}</span> aula{aulasFiltradas.length !== 1 ? "s" : ""}
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>
        )}
      </div>

      {/* ─── MODAL CONFIRMAR ELIMINACIÓN ─── */}
      {aulaAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              {/* Banda naranja superior */}
              <div className="h-1.5 bg-red-500 w-full" />
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar Aula?</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Estás a punto de eliminar{" "}
                  <strong className="text-gray-800">{aulaAEliminar.nombre}</strong>. Sus horarios
                  serán eliminados y los alumnos quedarán sin aula asignada.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAulaAEliminar(null)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEliminar}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
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
            </div>
          </div>,
          document.body,
        )}

      {/* ─── MODAL CREAR / EDITAR ─── */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              {/* Banda naranja superior */}
              <div className="h-1.5 bg-orange-500 w-full" />

              <div className="p-7">
                {/* Header del modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isEditing ? "Editar Aula" : "Nueva Aula"}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Campos */}
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre del Aula</label>
                    <input
                      type="text"
                      placeholder="Ej. Sala 1"
                      value={form.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Grado</label>
                      <input
                        type="text"
                        placeholder="Ej. 5to Primaria"
                        value={form.grado}
                        onChange={(e) => handleChange("grado", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Sección</label>
                      <input
                        type="text"
                        placeholder="Ej. A"
                        value={form.seccion}
                        onChange={(e) => handleChange("seccion", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Docente a cargo</label>
                    <select
                      value={form.id_docente}
                      onChange={(e) => handleChange("id_docente", e.target.value)}
                      className={inputCls}
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

                {/* Acciones */}
                <div className="mt-7 flex justify-end gap-3">
                  <button
                    onClick={cerrarModal}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-orange-200 disabled:opacity-60 transition-all active:scale-95"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Guardar Aula
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}