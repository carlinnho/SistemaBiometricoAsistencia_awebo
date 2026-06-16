import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import * as faceapi from "face-api.js";
import {
  Plus,
  X,
  Search,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  Camera,
  ScanFace,
  Check,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AlumnosService } from "../services/alumnos.service";
import { AulasService } from "../services/aulas.service";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", DNI: "", id_aula: "", padre_id: "" };

const PAGE_SIZE = 10;

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

/* ─── PAGINATION ─── */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize, searchTerm }) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const btnBase =
    "h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors";

  return (
    <div className="relative px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
      <p className="text-xs text-gray-400">
        Mostrando{" "}
        <span className="font-semibold text-gray-600">{from}–{to}</span>{" "}
        de{" "}
        <span className="font-semibold text-gray-600">{totalItems}</span>{" "}
        alumno{totalItems !== 1 ? "s" : ""}
        {searchTerm && ` para "${searchTerm}"`}
      </p>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="h-8 w-8 flex items-center justify-center text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${
                p === currentPage
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function Alumnos() {
  const [data, setData] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [padres, setPadres] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [alumnoAEliminar, setAlumnoAEliminar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Biometría
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [descriptor, setDescriptor] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listaAlumnos, listaAulas, listaUsuarios] = await Promise.all([
        AlumnosService.getAll(),
        AulasService.getAll(),
        UsuariosService.getAll(),
      ]);
      setData(Array.isArray(listaAlumnos) ? listaAlumnos : []);
      setAulas(Array.isArray(listaAulas) ? listaAulas : []);
      setPadres(
        Array.isArray(listaUsuarios)
          ? listaUsuarios.filter((u) => u.rol === "padre")
          : [],
      );
      setCurrentPage(1);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        showToast("error", "No se pudieron cargar los modelos biométricos.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (open) iniciarCamara();
    else {
      detenerCamara();
      setDescriptor(null);
    }
  }, [open]);

  // Resetear página al cambiar búsqueda
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      showToast("error", "No se pudo acceder a la cámara.");
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const capturarRostro = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsScanning(true);
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        showToast("error", "No se detectó un rostro claro. Mira fijamente a la cámara.");
        setDescriptor(null);
      } else {
        setDescriptor(Array.from(detection.descriptor));
        showToast("success", "Rostro capturado y codificado correctamente.");
      }
    } catch {
      showToast("error", "Error procesando la imagen.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.DNI || !form.id_aula || !form.padre_id)
      return showToast("error", "Complete todos los campos académicos.");
    if (!isEditing && !descriptor)
      return showToast("error", "Debe capturar el rostro del alumno antes de guardar.");

    const payload = {
      nombre: form.nombre,
      DNI: form.DNI,
      id_aula: Number(form.id_aula),
      padres_ids: [Number(form.padre_id)],
    };
    if (descriptor) payload.descriptor = descriptor;

    setIsSaving(true);
    try {
      if (isEditing) {
        await AlumnosService.update(editingId, payload);
        showToast("success", "Alumno actualizado correctamente.");
      } else {
        await AlumnosService.create(payload);
        showToast("success", "Alumno y biometría registrados correctamente.");
      }
      cerrarModal();
      await cargarDatos();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!alumnoAEliminar) return;
    setIsDeleting(true);
    try {
      await AlumnosService.remove(alumnoAEliminar.id_alumno);
      showToast("success", "Alumno y su biometría eliminados permanentemente.");
      setAlumnoAEliminar(null);
      await cargarDatos();
    } catch (err) {
      showToast("error", "No se pudo eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const abrirModalEditar = (alumno) => {
    setForm({
      nombre: alumno.nombre,
      DNI: alumno.DNI,
      id_aula: alumno.aula?.id_aula || alumno.id_aula || "",
      padre_id: alumno.padres?.length > 0 ? alumno.padres[0].id : "",
    });
    setEditingId(alumno.id_alumno);
    setIsEditing(true);
    setOpen(true);
  };

  const cerrarModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
    setOpen(false);
  };

  const alumnosFiltrados = useMemo(
    () =>
      data.filter(
        (d) =>
          d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.DNI.includes(searchTerm),
      ),
    [data, searchTerm],
  );

  // Datos paginados
  const totalPages = Math.ceil(alumnosFiltrados.length / PAGE_SIZE);
  const paginatedData = alumnosFiltrados.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm";

  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Gestión de Alumnos</h1>
            <p className="text-xs text-gray-400">Registro biométrico y académico de estudiantes.</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setIsEditing(false); setEditingId(null); setOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95"
        >
          <ScanFace className="h-4 w-4" /> Registrar Alumno
        </button>
      </div>

      {/* ─── BUSCADOR ─── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o DNI..."
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
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">DNI</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">Nombre del Alumno</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">Aula</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">Biometría</th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto h-7 w-7 text-orange-500 mb-2" />
                  <p className="text-sm text-gray-400">Cargando alumnos...</p>
                </td>
              </tr>
            ) : alumnosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No se encontraron alumnos.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((d) => (
                <tr key={d.id_alumno} className="hover:bg-orange-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 tracking-wider">
                    {d.DNI}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">{d.nombre}</td>
                  <td className="px-6 py-4">
                    {d.aula ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                        {d.aula.grado} <span className="text-gray-300">·</span> Sec. {d.aula.seccion}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {d.biometrias?.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <Check className="h-3 w-3" /> Registrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => abrirModalEditar(d)}
                        title="Editar Alumno"
                        className="p-2 rounded-xl text-orange-500 hover:bg-orange-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAlumnoAEliminar(d)}
                        title="Eliminar Alumno"
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

        {/* ─── PAGINACIÓN ─── */}
        {!isLoading && alumnosFiltrados.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={alumnosFiltrados.length}
            pageSize={PAGE_SIZE}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* ─── MODAL CONFIRMAR ELIMINACIÓN ─── */}
      {alumnoAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="h-1.5 bg-red-500 w-full" />
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">¿Eliminar Alumno?</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Estás a punto de eliminar a{" "}
                  <strong className="text-gray-800">{alumnoAEliminar.nombre}</strong>. Se borrará su
                  biometría y todo su historial de asistencia. Esta acción es irreversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAlumnoAEliminar(null)}
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
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ─── MODAL REGISTRO / EDICIÓN CON ESCÁNER ─── */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

              {/* ── Mitad Izquierda: Formulario ── */}
              <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
                <div className="h-1.5 bg-orange-500 w-full" />
                <div className="p-8 flex flex-col flex-1 bg-gray-50/60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800">
                      {isEditing ? "Editar Datos del Alumno" : "Datos del Alumno"}
                    </h2>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <label className={labelCls}>DNI</label>
                      <input
                        type="text"
                        maxLength="8"
                        placeholder="8 dígitos"
                        value={form.DNI}
                        onChange={(e) => handleChange("DNI", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Nombre Completo</label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => handleChange("nombre", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Asignar Aula</label>
                      <select
                        value={form.id_aula}
                        onChange={(e) => handleChange("id_aula", e.target.value)}
                        className={inputCls}
                      >
                        <option value="" disabled>Seleccione el aula...</option>
                        {aulas.map((a) => (
                          <option key={a.id_aula} value={a.id_aula}>
                            {a.nombre} — {a.grado} "{a.seccion}"
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Vincular Padre / Apoderado</label>
                      <select
                        value={form.padre_id}
                        onChange={(e) => handleChange("padre_id", e.target.value)}
                        className={inputCls}
                      >
                        <option value="" disabled>Seleccione al apoderado...</option>
                        {padres.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} {p.apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Mitad Derecha: Cámara ── */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 bg-white border-l border-gray-100">
                <div className="w-full flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-800">
                      Captura Facial
                      {isEditing && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(Opcional)</span>
                      )}
                    </h2>
                  </div>
                </div>

                <div className="relative w-full aspect-square max-w-[260px] mb-5">
                  <div className="absolute inset-0 bg-gray-100 rounded-2xl overflow-hidden">
                    {modelsLoaded && (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />
                    )}
                    {!descriptor && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg viewBox="0 0 64 72" className="w-24 h-24 text-gray-300 fill-current">
                          <circle cx="32" cy="20" r="13" />
                          <path d="M4 68c0-15.464 12.536-28 28-28s28 12.536 28 28" />
                        </svg>
                      </div>
                    )}
                    {!modelsLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
                        <span className="text-xs text-gray-400">Cargando IA...</span>
                      </div>
                    )}
                    {descriptor && (
                      <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                          <Check className="h-10 w-10" />
                        </div>
                      </div>
                    )}
                  </div>

                  {!descriptor && (<>
                    <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-orange-500 rounded-tl-2xl pointer-events-none" />
                    <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-orange-500 rounded-tr-2xl pointer-events-none" />
                    <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-orange-500 rounded-bl-2xl pointer-events-none" />
                    <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-orange-500 rounded-br-2xl pointer-events-none" />
                  </>)}
                </div>

                {descriptor ? (
                  <div className="w-full text-center p-3 bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm font-medium mb-4">
                    Rostro listo para guardar.
                    <button
                      onClick={() => setDescriptor(null)}
                      className="block w-full mt-1.5 text-xs text-green-600 underline"
                    >
                      Volver a capturar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={capturarRostro}
                    disabled={isScanning || !modelsLoaded}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-4"
                  >
                    {isScanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {isScanning ? "Analizando rostro..." : isEditing ? "Actualizar Rostro" : "Escanear Rostro"}
                  </button>
                )}

                <div className="w-full flex gap-3 mt-auto pt-2">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (!isEditing && !descriptor)}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEditing ? "Guardar Cambios" : "Guardar Alumno"}
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