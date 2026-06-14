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
} from "lucide-react";

import { AlumnosService } from "../services/alumnos.service";
import { AulasService } from "../services/aulas.service";
import { UsuariosService } from "../services/usuarios.service";

const emptyForm = { nombre: "", DNI: "", id_aula: "", padre_id: "" };

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

export default function Alumnos() {
  const [data, setData] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [padres, setPadres] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Estados del Modal y Formulario
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [alumnoAEliminar, setAlumnoAEliminar] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Biometría
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
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar modelos de face-api una sola vez
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
        console.error("Error cargando modelos face-api:", e);
        showToast("error", "No se pudieron cargar los modelos biométricos.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (open) {
      iniciarCamara();
    } else {
      detenerCamara();
      setDescriptor(null);
    }
  }, [open]);

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (e) {
      showToast("error", "No se pudo acceder a la cámara.");
    }
  };

  const detenerCamara = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
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
        showToast(
          "error",
          "No se detectó un rostro claro. Mira fijamente a la cámara.",
        );
        setDescriptor(null);
      } else {
        setDescriptor(Array.from(detection.descriptor));
        showToast("success", "Rostro capturado y codificado correctamente.");
      }
    } catch (e) {
      showToast("error", "Error procesando la imagen.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!form.nombre || !form.DNI || !form.id_aula || !form.padre_id) {
      return showToast("error", "Complete todos los campos académicos.");
    }
    // Si estamos creando, el rostro es obligatorio. Si estamos editando, es opcional.
    if (!isEditing && !descriptor) {
      return showToast(
        "error",
        "Debe capturar el rostro del alumno antes de guardar.",
      );
    }

    const payload = {
      nombre: form.nombre,
      DNI: form.DNI,
      id_aula: Number(form.id_aula),
      padres_ids: [Number(form.padre_id)],
    };

    if (descriptor) {
      payload.descriptor = descriptor;
    }

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
      padre_id:
        alumno.padres && alumno.padres.length > 0 ? alumno.padres[0].id : "",
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

  const alumnosFiltrados = useMemo(() => {
    return data.filter(
      (d) =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.DNI.includes(searchTerm),
    );
  }, [data, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in relative">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-blue-600" /> Gestión de Alumnos
        </h1>
        <button
          onClick={() => {
            setForm(emptyForm);
            setIsEditing(false);
            setEditingId(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <ScanFace className="h-4 w-4" /> Registrar Alumno
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4">DNI</th>
              <th className="px-6 py-4">Nombre del Alumno</th>
              <th className="px-6 py-4">Aula</th>
              <th className="px-6 py-4">Biometría</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto h-6 w-6 text-gray-400" />
                </td>
              </tr>
            ) : alumnosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No se encontraron alumnos.
                </td>
              </tr>
            ) : (
              alumnosFiltrados.map((d) => (
                <tr
                  key={d.id_alumno}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {d.DNI}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {d.nombre}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {d.aula ? `${d.aula.grado} "${d.aula.seccion}"` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {d.biometrias?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        <Check className="h-3 w-3" /> Registrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => abrirModalEditar(d)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded-md transition-colors"
                      title="Editar Alumno"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setAlumnoAEliminar(d)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-md transition-colors"
                      title="Eliminar Alumno"
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
      {alumnoAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar Alumno?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de eliminar a{" "}
                <strong>{alumnoAEliminar.nombre}</strong>. Se borrará su
                biometría y todo su historial de asistencia. Esta acción es
                irreversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAlumnoAEliminar(null)}
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

      {/* MODAL DE REGISTRO / EDICIÓN CON ESCÁNER INTEGRADO */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
              {/* Mitad Izquierda: Formulario de Datos */}
              <div className="w-full md:w-1/2 p-8 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                  {isEditing
                    ? "1. Editar Datos del Alumno"
                    : "1. Datos del Alumno"}
                </h2>
                <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      DNI
                    </label>
                    <input
                      type="text"
                      maxLength="8"
                      value={form.DNI}
                      onChange={(e) => handleChange("DNI", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="8 dígitos"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Asignar Aula
                    </label>
                    <select
                      value={form.id_aula}
                      onChange={(e) => handleChange("id_aula", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="" disabled>
                        Seleccione el aula...
                      </option>
                      {aulas.map((a) => (
                        <option key={a.id_aula} value={a.id_aula}>
                          {a.nombre} - {a.grado} "{a.seccion}"
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      Vincular Padre/Apoderado
                    </label>
                    <select
                      value={form.padre_id}
                      onChange={(e) => handleChange("padre_id", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="" disabled>
                        Seleccione al apoderado...
                      </option>
                      {padres.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mitad Derecha: Cámara y Biometría */}
              <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-white">
                <h2 className="text-xl font-bold mb-6 text-gray-800 w-full text-left">
                  2. Captura Facial{" "}
                  {isEditing && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      (Opcional)
                    </span>
                  )}
                </h2>

                <div className="relative w-full aspect-square max-w-[280px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner mb-6 border-4 border-slate-100">
                  {!modelsLoaded ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-xs">Cargando IA...</span>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {descriptor && (
                        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center border-4 border-emerald-400 rounded-xl">
                          <div className="bg-emerald-500 text-white rounded-full p-3 shadow-lg">
                            <Check className="h-10 w-10" />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {descriptor ? (
                  <div className="w-full text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 text-sm font-medium mb-4">
                    Rostro procesado y listo para guardar.
                    <button
                      onClick={() => setDescriptor(null)}
                      className="block w-full mt-2 text-xs text-emerald-600 underline"
                    >
                      Volver a capturar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={capturarRostro}
                    disabled={isScanning || !modelsLoaded}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {isScanning ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    {isScanning
                      ? "Analizando rostro..."
                      : isEditing
                        ? "Actualizar Rostro"
                        : "Escanear Rostro"}
                  </button>
                )}

                <div className="w-full flex gap-3 mt-auto pt-6">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (!isEditing && !descriptor)}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
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
