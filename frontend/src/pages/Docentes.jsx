import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import * as faceapi from "face-api.js";
import {
  Plus,
  Users,
  X,
  Search,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  ScanFace,
  Check,
  Clock,
  Trash2, // <-- Importamos el ícono de eliminar
  AlertTriangle, // <-- Importamos ícono de advertencia
} from "lucide-react";
import { UsuariosService } from "../services/usuarios.service";
import { HorariosPersonalService } from "../services/horarios-personal.service";

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  activo: true,
  hora_entrada: "08:00",
  Hora_limite_puntual: "08:15",
  hora_salida: "14:00",
};

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

export default function Docentes() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Estado de carga para el botón de eliminar
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingHorarioId, setEditingHorarioId] = useState(null);

  const [docenteAEliminar, setDocenteAEliminar] = useState(null); // Guardamos qué docente se quiere borrar

  const [searchTerm, setSearchTerm] = useState("");
  const [tabEstado, setTabEstado] = useState(true);

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [descriptor, setDescriptor] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDocentes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listaUsuarios, listaHorarios] = await Promise.all([
        UsuariosService.getAll(),
        HorariosPersonalService.getAll(),
      ]);

      const docentes = Array.isArray(listaUsuarios)
        ? listaUsuarios.filter((u) => u.rol === "docente")
        : [];

      const horarios = Array.isArray(listaHorarios) ? listaHorarios : [];

      const docentesConHorario = docentes.map((docente) => {
        const suHorario = horarios.find((h) => h.id_usuario === docente.id);
        return { ...docente, horario: suHorario };
      });

      setData(docentesConHorario);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDocentes();
  }, [cargarDocentes]);

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
        showToast("error", "Error cargando modelos de IA.");
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
        showToast("success", "Rostro capturado correctamente.");
      }
    } catch (e) {
      showToast("error", "Error procesando la imagen.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (
      !form.nombre ||
      !form.apellido ||
      !form.email ||
      (!isEditing && !form.password) ||
      !form.hora_entrada ||
      !form.Hora_limite_puntual ||
      !form.hora_salida
    ) {
      return showToast(
        "error",
        "Complete todos los campos obligatorios y el horario.",
      );
    }

    const payloadUsuario = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      activo: form.activo,
      rol: "docente",
      descriptor,
    };
    if (!isEditing || form.password) payloadUsuario.password = form.password;

    setIsSaving(true);
    try {
      let usuarioGuardado;
      if (isEditing) {
        usuarioGuardado = await UsuariosService.update(
          editingId,
          payloadUsuario,
        );
      } else {
        usuarioGuardado = await UsuariosService.create(payloadUsuario);
      }

      const payloadHorario = {
        id_usuario: isEditing ? editingId : usuarioGuardado.id,
        hora_entrada: form.hora_entrada,
        Hora_limite_puntual: form.Hora_limite_puntual,
        hora_salida: form.hora_salida,
      };

      if (editingHorarioId) {
        await HorariosPersonalService.update(editingHorarioId, payloadHorario);
      } else {
        await HorariosPersonalService.create(payloadHorario);
      }

      showToast(
        "success",
        `Docente y horario ${isEditing ? "actualizados" : "registrados"} correctamente.`,
      );
      cerrarModal();
      await cargarDocentes();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── LÓGICA DE ELIMINACIÓN ───
  const handleEliminar = async () => {
    if (!docenteAEliminar) return;
    setIsDeleting(true);
    try {
      await UsuariosService.remove(docenteAEliminar.id);
      showToast(
        "success",
        "Docente, horario y biometría eliminados permanentemente.",
      );
      setDocenteAEliminar(null);
      await cargarDocentes();
    } catch (err) {
      showToast("error", "No se pudo eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const abrirModalEditar = (docente) => {
    setForm({
      nombre: docente.nombre,
      apellido: docente.apellido,
      email: docente.email,
      password: "",
      activo: docente.activo,
      hora_entrada: docente.horario?.hora_entrada?.slice(0, 5) || "08:00",
      Hora_limite_puntual:
        docente.horario?.Hora_limite_puntual?.slice(0, 5) || "08:15",
      hora_salida: docente.horario?.hora_salida?.slice(0, 5) || "14:00",
    });
    setEditingId(docente.id);
    setEditingHorarioId(docente.horario?.id_horario_usuario || null);
    setIsEditing(true);
    setOpen(true);
  };

  const cerrarModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
    setEditingHorarioId(null);
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
          <Users className="h-6 w-6 text-blue-600" /> Gestión de Docentes
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo Docente
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
              <th className="px-6 py-4">Horario</th>
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
              docentesFiltrados.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">
                    {d.nombre} {d.apellido}
                  </td>
                  <td className="px-6 py-4">{d.email}</td>
                  <td className="px-6 py-4 font-mono text-gray-600">
                    {d.horario
                      ? `${d.horario.hora_entrada.slice(0, 5)} - ${d.horario.hora_salida.slice(0, 5)}`
                      : "Sin horario"}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => abrirModalEditar(d)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDocenteAEliminar(d)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-md transition-colors"
                      title="Eliminar"
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
      {docenteAEliminar &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¿Eliminar Docente?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de eliminar a{" "}
                <strong>
                  {docenteAEliminar.nombre} {docenteAEliminar.apellido}
                </strong>
                . Esta acción borrará su perfil, su biometría facial, su horario
                y sus registros de asistencia. Es irreversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDocenteAEliminar(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-8 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                  {isEditing ? "Editar Docente" : "Nuevo Docente"}
                </h2>

                <div className="space-y-4 flex-1">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={form.nombre}
                    onChange={(e) => handleChange("nombre", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={form.apellido}
                    onChange={(e) => handleChange("apellido", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder={
                      isEditing
                        ? "Dejar en blanco para no cambiar"
                        : "Contraseña"
                    }
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />

                  {isEditing && (
                    <label className="flex items-center gap-2 text-sm mt-2 font-medium">
                      <input
                        type="checkbox"
                        checked={form.activo}
                        onChange={(e) =>
                          handleChange("activo", e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      Docente Activo en el Sistema
                    </label>
                  )}

                  <h3 className="text-sm font-bold text-gray-700 mt-6 mb-2 border-b pb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" /> Horario de
                    Trabajo
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                        Entrada
                      </label>
                      <input
                        type="time"
                        value={form.hora_entrada}
                        onChange={(e) =>
                          handleChange("hora_entrada", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                        Límite
                      </label>
                      <input
                        type="time"
                        value={form.Hora_limite_puntual}
                        onChange={(e) =>
                          handleChange("Hora_limite_puntual", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                        Salida
                      </label>
                      <input
                        type="time"
                        value={form.hora_salida}
                        onChange={(e) =>
                          handleChange("hora_salida", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-white">
                <h2 className="text-xl font-bold mb-6 text-gray-800 w-full text-left">
                  Biometría Facial
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
                    {isScanning ? "Analizando rostro..." : "Escanear Rostro"}
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
                    disabled={isSaving || (!descriptor && !isEditing)}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                    Guardar
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
