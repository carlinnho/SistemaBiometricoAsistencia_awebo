import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Users, X, Search, CheckCircle, AlertCircle,
  Loader2, Settings, Trash2, AlertTriangle,
} from "lucide-react";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", apellido: "", email: "", password: "", activo: true };

const inp = "w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-colors text-sm";

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

function PadreCard({ padre, onEdit, onDelete }) {
  const initials = `${padre.nombre?.[0] ?? ""}${padre.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 overflow-hidden group">
      <div className="h-1.5 w-full bg-orange-500" />
      <div className="p-5 pt-3">
        {/* Botones */}
        <div className="flex items-start justify-end mb-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(padre)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-400 flex items-center justify-center transition-colors"
              title="Editar"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(padre)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Avatar + nombre + badge */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-md shadow-orange-200">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800 text-base leading-tight truncate">
                {padre.nombre} {padre.apellido}
              </p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${padre.activo ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                {padre.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-sm text-slate-400 truncate">{padre.email}</p>
          </div>
        </div>
      </div>
    </div>
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
    return data.filter((d) => {
      if (d.activo !== tabEstado) return false;
      const term = searchTerm.toLowerCase();
      return d.nombre.toLowerCase().includes(term) || d.apellido.toLowerCase().includes(term);
    });
  }, [data, searchTerm, tabEstado]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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

      {/* GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-orange-500" /></div>
      ) : padresFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <span className="text-sm font-medium">No se encontraron padres</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {padresFiltrados.map((padre) => (
            <PadreCard key={padre.id} padre={padre} onEdit={abrirEditar} onDelete={setPadreAEliminar} />
          ))}
        </div>
      )}

      {!isLoading && padresFiltrados.length > 0 && (
        <p className="mt-6 text-xs text-slate-400">{padresFiltrados.length} resultado{padresFiltrados.length !== 1 ? "s" : ""}</p>
      )}

      {openModal && (
        <PadreModal
          isEditing={isEditing}
          padre={padreEditando}
          onClose={cerrarModal}
          onSave={handleSave}
          isSaving={isSaving}
        />
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