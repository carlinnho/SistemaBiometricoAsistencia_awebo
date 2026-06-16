import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import * as faceapi from "face-api.js";
import {
  Plus, Users, X, Search, CheckCircle, AlertCircle,
  Loader2, Camera, Check, Clock, Trash2, AlertTriangle,
  User, Save, 
} from "lucide-react";
import { UsuariosService } from "../services/usuarios.service";
import { HorariosPersonalService } from "../services/horarios-personal.service";

const emptyForm = {
  nombre: "", apellido: "", email: "", password: "", activo: true,
  hora_entrada: "08:00", Hora_limite_puntual: "08:15", hora_salida: "14:00",
};

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div className={`fixed bottom-5 right-5 z-[200] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
      {isError
        ? <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
        : <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />}
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>,
    document.body,
  );
}

const inp = "w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-colors text-sm";

function EditModal({ docente, onClose, onSave }) {
  const [form, setForm] = useState({
    nombre: docente.nombre,
    apellido: docente.apellido,
    email: docente.email,
    password: "",
    activo: docente.activo,
    hora_entrada: docente.horario?.hora_entrada?.slice(0, 5) || "08:00",
    Hora_limite_puntual: docente.horario?.Hora_limite_puntual?.slice(0, 5) || "08:15",
    hora_salida: docente.horario?.hora_salida?.slice(0, 5) || "14:00",
  });
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [descriptor, setDescriptor] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => {});
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]).then(() => setModelsLoaded(true)).catch(() => {});
  }, []);

  const capturar = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsScanning(true);
    try {
      const det = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      if (det) setDescriptor(Array.from(det.descriptor));
    } finally { setIsScanning(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(docente, form, descriptor);
    setSaving(false);
    onClose();
  };

  const f = (field, val) => setForm({ ...form, [field]: val });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

        {/* Panel izquierdo */}
        <div className="w-full md:w-1/2 p-8 border-r border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-0.5">Editar registro</p>
              <h2 className="text-xl font-bold text-slate-800">Actualizar Docente</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre" value={form.nombre} onChange={(e) => f("nombre", e.target.value)} className={inp} />
              <input type="text" placeholder="Apellido" value={form.apellido} onChange={(e) => f("apellido", e.target.value)} className={inp} />
            </div>
            <input type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => f("email", e.target.value)} className={inp} />
            <input type="password" placeholder="Contraseña (dejar en blanco para no cambiar)" value={form.password} onChange={(e) => f("password", e.target.value)} className={inp} />

            <label className="flex items-center gap-2.5 text-sm text-slate-500 cursor-pointer select-none mt-1">
              <div className="relative">
                <input type="checkbox" checked={form.activo} onChange={(e) => f("activo", e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-orange-500 transition-colors border border-slate-200 peer-checked:border-orange-500" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-all shadow-sm" />
              </div>
              Docente activo en el sistema
            </label>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Horario de trabajo</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Entrada", field: "hora_entrada" },
                  { label: "Límite puntual", field: "Hora_limite_puntual" },
                  { label: "Salida", field: "hora_salida" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">{label}</label>
                    <input type="time" value={form[field]} onChange={(e) => f(field, e.target.value)} className={inp + " font-mono"} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: Biometría */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center bg-orange-50/40">
          <div className="w-full mb-6">
            <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-0.5">Reconocimiento facial</p>
            <h2 className="text-xl font-bold text-slate-800">Biometría</h2>
          </div>

          <div className="relative w-full aspect-square max-w-[260px] rounded-3xl overflow-hidden shadow-lg mb-5 ring-2 ring-orange-200 bg-slate-100">
            {!modelsLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <User className="h-20 w-20 text-slate-200 absolute" />
                <Loader2 className="h-7 w-7 animate-spin mb-2 text-orange-400 relative z-10" />
                <span className="text-xs relative z-10">Cargando IA...</span>
              </div>
            ) : (
              <>
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="h-20 w-20 text-slate-300" />
                  </div>
                )}
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {!descriptor && modelsLoaded && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-orange-500 rounded-tl-xl" />
                    <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-orange-500 rounded-tr-xl" />
                    <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-orange-500 rounded-bl-xl" />
                    <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-orange-500 rounded-br-xl" />
                  </div>
                )}
                {descriptor && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white rounded-full p-3 shadow-lg ring-4 ring-emerald-200"><Check className="h-9 w-9" /></div>
                  </div>
                )}
              </>
            )}
          </div>

          {descriptor ? (
            <div className="w-full text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-600 text-sm font-medium mb-4">
              Rostro procesado y listo.
              <button onClick={() => setDescriptor(null)} className="block w-full mt-1 text-xs text-emerald-500 hover:text-emerald-700 underline">Volver a capturar</button>
            </div>
          ) : (
            <button onClick={capturar} disabled={isScanning || !modelsLoaded}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-orange-200 mb-4">
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {isScanning ? "Analizando..." : "Escanear Rostro"}
            </button>
          )}

          <div className="w-full flex gap-3 mt-auto">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-2xl text-sm font-semibold transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 shadow-md shadow-orange-200 transition-all">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── CARD DE DOCENTE ── */
function DocenteCard({ docente, onEdit, onDelete }) {
  const initials = `${docente.nombre?.[0] ?? ""}${docente.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 overflow-hidden group">
      <div className="h-1.5 w-full bg-orange-500" />

      <div className="p-5">
        {/* Header: solo botones */}
        <div className="flex items-start justify-end mb-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(docente)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-400 flex items-center justify-center transition-colors"
              title="Editar"
            >
              <User className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(docente)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Avatar + nombre */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-md shadow-orange-200">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-base leading-tight truncate">
              {docente.nombre} {docente.apellido}
            </p>
            <p className="text-sm text-slate-400 truncate">{docente.email}</p>
          </div>
        </div>

        {/* Horario */}
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Horario</span>
          </div>
          <p className="text-sm font-mono font-semibold text-slate-600">
            {docente.horario
              ? `${docente.horario.hora_entrada.slice(0, 5)}  →  ${docente.horario.hora_salida.slice(0, 5)}`
              : <span className="text-slate-400 font-sans font-normal text-xs">Sin horario asignado</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL NUEVO DOCENTE ── */
function NuevoModal({ onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [descriptor, setDescriptor] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const showErr = (msg) => alert(msg);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((s) => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => {});
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]).then(() => setModelsLoaded(true)).catch(() => {});
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  const capturar = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsScanning(true);
    try {
      const det = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      if (det) setDescriptor(Array.from(det.descriptor));
    } finally { setIsScanning(false); }
  };

  const f = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) return;
    setIsSaving(true);
    try {
      const u = await UsuariosService.create({ nombre: form.nombre, apellido: form.apellido, email: form.email, activo: true, rol: "docente", descriptor, password: form.password });
      await HorariosPersonalService.create({ id_usuario: u.id, hora_entrada: form.hora_entrada, Hora_limite_puntual: form.Hora_limite_puntual, hora_salida: form.hora_salida });
      onSaved();
      onClose();
    } catch (err) { showErr(err.message); }
    finally { setIsSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 border-r border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-0.5">Nuevo registro</p>
              <h2 className="text-xl font-bold text-slate-800">Agregar Docente</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre" value={form.nombre} onChange={(e) => f("nombre", e.target.value)} className={inp} />
              <input type="text" placeholder="Apellido" value={form.apellido} onChange={(e) => f("apellido", e.target.value)} className={inp} />
            </div>
            <input type="email" placeholder="Correo electrónico" value={form.email} onChange={(e) => f("email", e.target.value)} className={inp} />
            <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => f("password", e.target.value)} className={inp} />
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-orange-500" /></div>
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400">Horario de trabajo</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Entrada", field: "hora_entrada" }, { label: "Límite puntual", field: "Hora_limite_puntual" }, { label: "Salida", field: "hora_salida" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">{label}</label>
                    <input type="time" value={form[field]} onChange={(e) => f(field, e.target.value)} className={inp + " font-mono"} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col items-center bg-orange-50/40">
          <div className="w-full mb-6">
            <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold mb-0.5">Reconocimiento facial</p>
            <h2 className="text-xl font-bold text-slate-800">Biometría</h2>
          </div>

          <div className="relative w-full aspect-square max-w-[260px] rounded-3xl overflow-hidden shadow-lg mb-5 ring-2 ring-orange-200 bg-slate-100">
            {!modelsLoaded ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <User className="h-20 w-20 text-slate-200 absolute" />
                <Loader2 className="h-7 w-7 animate-spin mb-2 text-orange-400 relative z-10" />
                <span className="text-xs relative z-10">Cargando IA...</span>
              </div>
            ) : (
              <>
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="h-20 w-20 text-slate-300" />
                  </div>
                )}
                <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {!descriptor && modelsLoaded && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-orange-500 rounded-tl-xl" />
                    <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-orange-500 rounded-tr-xl" />
                    <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-orange-500 rounded-bl-xl" />
                    <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-orange-500 rounded-br-xl" />
                  </div>
                )}
                {descriptor && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white rounded-full p-3 shadow-lg ring-4 ring-emerald-200"><Check className="h-9 w-9" /></div>
                  </div>
                )}
              </>
            )}
          </div>

          {descriptor ? (
            <div className="w-full text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-600 text-sm font-medium mb-4">
              Rostro procesado y listo.
              <button onClick={() => setDescriptor(null)} className="block w-full mt-1 text-xs text-emerald-500 hover:text-emerald-700 underline">Volver a capturar</button>
            </div>
          ) : (
            <button onClick={capturar} disabled={isScanning || !modelsLoaded}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-200 mb-4 transition-all">
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {isScanning ? "Analizando..." : "Escanear Rostro"}
            </button>
          )}
          <div className="w-full flex gap-3 mt-auto">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-2xl text-sm font-semibold transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={isSaving || !descriptor}
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

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function Docentes() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const [openNuevo, setOpenNuevo] = useState(false);
  const [docenteEditando, setDocenteEditando] = useState(null);
  const [docenteAEliminar, setDocenteAEliminar] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [tabEstado, setTabEstado] = useState(true);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDocentes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listaUsuarios, listaHorarios] = await Promise.all([UsuariosService.getAll(), HorariosPersonalService.getAll()]);
      const docentes = Array.isArray(listaUsuarios) ? listaUsuarios.filter((u) => u.rol === "docente") : [];
      const horarios = Array.isArray(listaHorarios) ? listaHorarios : [];
      setData(docentes.map((d) => ({ ...d, horario: horarios.find((h) => h.id_usuario === d.id) })));
    } catch (err) { showToast("error", err.message); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { cargarDocentes(); }, [cargarDocentes]);

  const handleCardSave = async (docente, form, descriptor) => {
    try {
      const payload = { nombre: form.nombre, apellido: form.apellido, email: form.email, activo: form.activo };
      if (form.password) payload.password = form.password;
      if (descriptor) payload.descriptor = descriptor;
      await UsuariosService.update(docente.id, payload);
      if (docente.horario?.id_horario_usuario) {
        await HorariosPersonalService.update(docente.horario.id_horario_usuario, {
          id_usuario: docente.id,
          hora_entrada: form.hora_entrada,
          Hora_limite_puntual: form.Hora_limite_puntual,
          hora_salida: form.hora_salida,
        });
      }
      showToast("success", "Docente actualizado correctamente.");
      await cargarDocentes();
    } catch (err) { showToast("error", err.message); }
  };

  const handleEliminar = async () => {
    if (!docenteAEliminar) return;
    setIsDeleting(true);
    try {
      await UsuariosService.remove(docenteAEliminar.id);
      showToast("success", "Docente eliminado correctamente.");
      setDocenteAEliminar(null);
      await cargarDocentes();
    } catch (err) { showToast("error", "No se pudo eliminar: " + err.message); }
    finally { setIsDeleting(false); }
  };

  const docentesFiltrados = useMemo(() => {
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
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Gestión de Docentes</h1>
            <p className="text-xs text-slate-400">{data.length} docentes en el sistema</p>
          </div>
        </div>
        <button onClick={() => setOpenNuevo(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-orange-200 transition-all">
          <Plus className="h-4 w-4" />Nuevo Docente
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
          <input type="text" placeholder="Buscar docente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-700 placeholder-slate-400 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors shadow-sm" />
        </div>
      </div>

      {/* GRID */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-orange-500" /></div>
      ) : docentesFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Users className="h-10 w-10 mb-3 opacity-30" />
          <span className="text-sm font-medium">No se encontraron docentes</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docentesFiltrados.map((docente) => (
            <DocenteCard key={docente.id} docente={docente} onEdit={setDocenteEditando} onDelete={setDocenteAEliminar} />
          ))}
        </div>
      )}

      {!isLoading && docentesFiltrados.length > 0 && (
        <p className="mt-6 text-xs text-slate-400">{docentesFiltrados.length} resultado{docentesFiltrados.length !== 1 ? "s" : ""}</p>
      )}

      {openNuevo && <NuevoModal onClose={() => setOpenNuevo(false)} onSaved={() => { showToast("success", "Docente registrado correctamente."); cargarDocentes(); }} />}

      {docenteEditando && (
        <EditModal
          docente={docenteEditando}
          onClose={() => setDocenteEditando(null)}
          onSave={async (docente, form, descriptor) => { await handleCardSave(docente, form, descriptor); }}
        />
      )}

      {docenteAEliminar && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-7 text-center">
            <div className="mx-auto w-14 h-14 bg-red-50 ring-2 ring-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar docente?</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Vas a eliminar a{" "}
              <span className="text-slate-700 font-semibold">{docenteAEliminar.nombre} {docenteAEliminar.apellido}</span>
              . Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDocenteAEliminar(null)} disabled={isDeleting}
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