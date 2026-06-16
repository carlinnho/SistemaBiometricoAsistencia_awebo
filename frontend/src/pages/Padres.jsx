import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Users, X, Search, CheckCircle, AlertCircle,
  Loader2, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", apellido: "", email: "", password: "", activo: true };

const inp = "w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-colors text-sm";

// Paleta variada: naranja, verde, azul, púrpura, rosa, teal, índigo, rojo
const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-600",
];

function getAvatarColor(name = "") {
  // Usa charCode de las primeras dos letras para más variedad
  const code = (name.charCodeAt(0) ?? 0) + (name.charCodeAt(1) ?? 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const ITEMS_PER_PAGE = 10;

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div className={`fixed bottom-5 right-5 z-[200] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
      {isError ? <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" /> : <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>,
    document.body,
  );
}

function PadreModal({ isEditing, padre, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(
    isEditing && padre
      ? { nombre: padre.nombre, apellido: padre.apellido, email: padre.email, password: "", activo: padre.activo }
      : emptyForm
  );
  const f = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-0.5">
                {isEditing ? "Editar registro" : "Nuevo registro"}
              </p>
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? "Actualizar Padre" : "Agregar Padre"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre" value={form.nombre} onChange={(e) => f("nombre", e.target.value)} className={inp} />
              <input type="text" placeholder="Apellido" value={form.apellido} onChange={(e) => f("apellido", e.target.value)} className={inp} />
            </div>
            <input type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => f("email", e.target.value)} className={inp} />
            <input type="password" placeholder={isEditing ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"} value={form.password} onChange={(e) => f("password", e.target.value)} className={inp} />
            {isEditing && (
              <label className="flex items-center gap-2.5 text-sm text-slate-500 cursor-pointer select-none mt-1">
                <div className="relative">
                  <input type="checkbox" checked={form.activo} onChange={(e) => f("activo", e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-orange-500 transition-colors border border-slate-200 peer-checked:border-orange-500" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-all shadow-sm" />
                </div>
                Padre activo en el sistema
              </label>
            )}
          </div>
          <div className="flex gap-3 mt-7">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-2xl text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button onClick={() => onSave(form)} disabled={isSaving}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-orange-200 transition-all">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Padres() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [padreEditando, setPadreEditando] = useState(null);
  const [padreAEliminar, setPadreAEliminar] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [tabEstado, setTabEstado] = useState(true);
  const [page, setPage] = useState(1);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarPadres = useCallback(async () => {
    setIsLoading(true);
    try {
      const lista = await UsuariosService.getAll();
      setData(Array.isArray(lista) ? lista.filter((u) => u.rol === "padre") : []);
    } catch (err) { showToast("error", err.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { cargarPadres(); }, [cargarPadres]);

  const abrirNuevo = () => { setIsEditing(false); setPadreEditando(null); setOpenModal(true); };
  const abrirEditar = (padre) => { setIsEditing(true); setPadreEditando(padre); setOpenModal(true); };
  const cerrarModal = () => { setOpenModal(false); setPadreEditando(null); setIsEditing(false); };

  const handleSave = async (form) => {
    if (!form.nombre || !form.apellido || !form.email || (!isEditing && !form.password))
      return showToast("error", "Complete los campos obligatorios.");
    const payload = { ...form, rol: "padre" };
    if (isEditing && !payload.password) delete payload.password;
    setIsSaving(true);
    try {
      if (isEditing) await UsuariosService.update(padreEditando.id, payload);
      else await UsuariosService.create(payload);
      showToast("success", `Padre ${isEditing ? "actualizado" : "registrado"} correctamente.`);
      cerrarModal();
      await cargarPadres();
    } catch (err) { showToast("error", err.message); }
    finally { setIsSaving(false); }
  };

  const handleEliminar = async () => {
    if (!padreAEliminar) return;
    setIsDeleting(true);
    try {
      await UsuariosService.remove(padreAEliminar.id);
      showToast("success", "Padre eliminado correctamente.");
      setPadreAEliminar(null);
      await cargarPadres();
    } catch (err) { showToast("error", "No se pudo eliminar: " + err.message); }
    finally { setIsDeleting(false); }
  };

  const padresFiltrados = useMemo(() => {
    setPage(1);
    return data.filter((d) => {
      if (d.activo !== tabEstado) return false;
      const term = searchTerm.toLowerCase();
      return d.nombre.toLowerCase().includes(term) || d.apellido.toLowerCase().includes(term);
    });
  }, [data, searchTerm, tabEstado]);

  const totalPages = Math.max(1, Math.ceil(padresFiltrados.length / ITEMS_PER_PAGE));
  const paginated = padresFiltrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center ring-2 ring-orange-200">
            <Users className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Gestión de Padres de Familia</h1>
            <p className="text-xs text-slate-400">{data.length} padres en el sistema</p>
          </div>
        </div>
        <button onClick={abrirNuevo}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-orange-200 transition-all">
          <Plus className="h-4 w-4" /> Nuevo Padre de Familia
        </button>
      </div>

      {/* TABS + BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
          {[{ label: "Activos", value: true }, { label: "Inactivos", value: false }].map((tab) => (
            <button key={tab.label} onClick={() => setTabEstado(tab.value)}
              className={`px-5 py-1.5 text-sm rounded-xl font-semibold transition-all ${tabEstado === tab.value ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "text-slate-400 hover:text-slate-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar padre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-700 placeholder-slate-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors shadow-sm" />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          </div>
        ) : padresFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <span className="text-sm font-medium">No se encontraron padres</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((padre) => {
                const initials = `${padre.nombre?.[0] ?? ""}${padre.apellido?.[0] ?? ""}`.toUpperCase();
                const avatarColor = getAvatarColor(padre.nombre);
                return (
                  <tr key={padre.id} className="hover:bg-orange-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{padre.nombre} {padre.apellido}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{padre.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${padre.activo ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${padre.activo ? "bg-emerald-500" : "bg-red-400"}`} />
                        {padre.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditar(padre)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-500 text-slate-400 flex items-center justify-center transition-colors"
                          title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setPadreAEliminar(padre)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
                          title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* FOOTER con paginación*/}
{!isLoading && padresFiltrados.length > 0 && (
  <div className="px-6 py-4 border-t border-slate-100 grid grid-cols-3 items-center">
    {/* Columna izquierda: contador */}
    <p className="text-xs text-slate-400">
      Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, padresFiltrados.length)} de {padresFiltrados.length} padre{padresFiltrados.length !== 1 ? "s" : ""}
    </p>

    {/* Columna central: paginación perfectamente centrada */}
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-500 text-slate-400 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setPage(p)}
          className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors ${p === page ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-slate-100 text-slate-500 hover:bg-orange-100 hover:text-orange-500"}`}>
          {p}
        </button>
      ))}

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-500 text-slate-400 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>

  
    <div />
  </div>
)}
      </div>

      {openModal && (
        <PadreModal isEditing={isEditing} padre={padreEditando} onClose={cerrarModal} onSave={handleSave} isSaving={isSaving} />
      )}

      {padreAEliminar && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-7 text-center">
            <div className="mx-auto w-14 h-14 bg-red-50 ring-2 ring-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar padre?</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Vas a eliminar a{" "}
              <span className="text-slate-700 font-semibold">{padreAEliminar.nombre} {padreAEliminar.apellido}</span>
              . Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPadreAEliminar(null)} disabled={isDeleting}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEliminar} disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}