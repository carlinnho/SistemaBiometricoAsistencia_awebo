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
  Clock,
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
      className={`fixed bottom-5 right-5 z-200 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}
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

/* ─── CARD DE AULA ─── */
function AulaCard({ aula, onEdit, onDelete }) {
  const docente = aula.docente;
  const initials = docente
    ? `${docente.nombre?.[0] ?? ""}${docente.apellido?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Franja naranja superior */}
      <div className="h-1.5 w-full bg-orange-500" />

      <div className="p-4 flex flex-col gap-3">
        {/* Fila 1: Título + botones al mismo nivel */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
            {aula.nombre}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(aula)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-100 hover:text-orange-500 text-slate-400 flex items-center justify-center transition-colors"
              title="Editar"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(aula)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Fila 2: Badge grado/sección */}
        <div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-500">
            {aula.grado} <span className="text-slate-300">·</span> Sec.{" "}
            {aula.seccion}
          </span>
        </div>

        {/* Fila 3: Docente — avatar naranja fijo + nombre + email */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-orange-200">
            {initials}
          </div>
          {docente ? (
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm leading-tight truncate">
                {docente.nombre} {docente.apellido}
              </p>
              <p className="text-xs text-slate-400 truncate">{docente.email}</p>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Sin docente asignado
            </span>
          )}
        </div>

        {/* Fila 4: Horario (opcional) */}
        {(aula.hora_inicio || aula.hora_fin) && (
          <div className="pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                Horario
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {aula.hora_inicio ?? "—"} → {aula.hora_fin ?? "—"}
            </p>
          </div>
        )}
      </div>
    </div>
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

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.nombre || !form.grado || !form.seccion || !form.id_docente)
      return showToast("error", "Complete todos los campos obligatorios.");
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
    () =>
      data.filter((d) =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [data, searchTerm],
  );

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm";
  const labelCls =
    "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-500 rounded-2xl flex items-center justify-center shadow-md shadow-orange-200">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              Gestión de Aulas
            </h1>
            <p className="text-xs text-slate-400">
              Administra las aulas y sus docentes asignados.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-orange-200 transition-all"
        >
          <Plus className="h-4 w-4" /> Nueva Aula
        </button>
      </div>

      {/* ─── BÚSQUEDA ─── */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar aula por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 text-slate-700 placeholder-slate-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ─── GRID DE CARDS ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        </div>
      ) : aulasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <BookOpen className="h-10 w-10 mb-3 opacity-30" />
          <span className="text-sm font-medium">No se encontraron aulas</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {aulasFiltradas.map((aula) => (
              <AulaCard
                key={aula.id_aula}
                aula={aula}
                onEdit={abrirModalEditar}
                onDelete={setAulaAEliminar}
              />
            ))}
          </div>
          <p className="mt-5 text-xs text-slate-400">
            Mostrando {aulasFiltradas.length} aula
            {aulasFiltradas.length !== 1 ? "s" : ""}
            {searchTerm && ` para "${searchTerm}"`}
          </p>
        </>
      )}

      {/* ─── MODAL ELIMINAR ─── */}
      {aulaAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="h-1.5 bg-red-500 w-full" />
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">
                  ¿Eliminar Aula?
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Estás a punto de eliminar{" "}
                  <strong className="text-slate-800">
                    {aulaAEliminar.nombre}
                  </strong>
                  . Sus horarios serán eliminados y los alumnos quedarán sin
                  aula asignada.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAulaAEliminar(null)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
              <div className="h-1.5 bg-orange-500 w-full" />
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {isEditing ? "Editar Aula" : "Nueva Aula"}
                    </h2>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre del Aula</label>
                    <input
                      type="text"
                      placeholder="Ej. Aula Newton"
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
                        placeholder="Ej. 5to"
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
                        onChange={(e) =>
                          handleChange("seccion", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Docente a cargo</label>
                    <select
                      value={form.id_docente}
                      onChange={(e) =>
                        handleChange("id_docente", e.target.value)
                      }
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

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    onClick={cerrarModal}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
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
