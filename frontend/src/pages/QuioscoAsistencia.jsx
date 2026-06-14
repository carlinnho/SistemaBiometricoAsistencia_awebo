import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import {
  ScanFace,
  Loader2,
  Play,
  Square,
  CheckCircle2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { AlumnosService } from "../services/alumnos.service";
import { UsuariosService } from "../services/usuarios.service";
import { AsistenciaService } from "../services/asistencia.service";

export default function QuioscoAsistencia() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [isScanningMode, setIsScanningMode] = useState(false);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);

  const [logs, setLogs] = useState([]);
  const scanInterval = useRef(null);
  const cooldowns = useRef({});

  // ─── FUNCIÓN PARA CARGAR EL HISTORIAL AL ENTRAR ───
  const cargarHistorialDeHoy = async () => {
    try {
      const data = await AsistenciaService.getAll();

      // Obtenemos la fecha de hoy en formato YYYY-MM-DD ajustada a la zona horaria (UTC-5)
      const hoyIso = new Date(new Date().getTime() - 5 * 3600 * 1000)
        .toISOString()
        .split("T")[0];

      // Filtramos solo los de hoy
      const registrosHoy = Array.isArray(data)
        ? data.filter((a) => a.fecha.startsWith(hoyIso))
        : [];

      let historial = [];

      registrosHoy.forEach((asis) => {
        const nombrePersona = asis.alumno
          ? asis.alumno.nombre
          : asis.usuario
            ? `${asis.usuario.nombre} ${asis.usuario.apellido}`
            : "Desconocido";

        // Burbuja de Entrada
        if (asis.hora_entrada) {
          historial.push({
            id: `${asis.id_asistencia}_E`,
            nombre: nombrePersona,
            accion: "ENTRADA",
            hora: asis.hora_entrada,
            estado: asis.estado,
            // Guardamos un timestamp falso para poder ordenarlos
            timestamp: new Date(`${hoyIso}T${asis.hora_entrada}`).getTime(),
          });
        }

        // Burbuja de Salida
        if (asis.hora_salida) {
          historial.push({
            id: `${asis.id_asistencia}_S`,
            nombre: nombrePersona,
            accion: "SALIDA",
            hora: asis.hora_salida,
            estado: "puntual", // Las salidas siempre salen azules
            timestamp: new Date(`${hoyIso}T${asis.hora_salida}`).getTime(),
          });
        }
      });

      // Ordenar del más reciente (mayor timestamp) al más antiguo
      historial.sort((a, b) => b.timestamp - a.timestamp);

      // Guardamos solo los últimos 15
      setLogs(historial.slice(0, 15));
    } catch (error) {
      console.error("Error cargando el historial del día:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);

        // Cargar bases de datos y armar descriptores
        const [alumnosData, usuariosData] = await Promise.all([
          AlumnosService.getAll(),
          UsuariosService.getAll(),
        ]);

        const faceMatcherData = [];

        // Filtro estricto de alumnos
        if (Array.isArray(alumnosData)) {
          alumnosData.forEach((al) => {
            if (al.biometrias && al.biometrias.length > 0) {
              try {
                const raw =
                  typeof al.biometrias[0].embedding_facial === "string"
                    ? JSON.parse(al.biometrias[0].embedding_facial)
                    : al.biometrias[0].embedding_facial;

                const descriptorArray = Array.isArray(raw)
                  ? raw
                  : Object.values(raw);

                if (descriptorArray.length === 128) {
                  const metaData = JSON.stringify({
                    id: al.id_alumno,
                    tipo: "alumno",
                    nombre: al.nombre,
                  });
                  faceMatcherData.push(
                    new faceapi.LabeledFaceDescriptors(metaData, [
                      new Float32Array(descriptorArray),
                    ]),
                  );
                }
              } catch (e) {
                console.warn(`Error parseando rostro alumno: ${al.nombre}`);
              }
            }
          });
        }

        // Filtro estricto de personal
        if (Array.isArray(usuariosData)) {
          usuariosData.forEach((u) => {
            if (u.biometrias && u.biometrias.length > 0) {
              try {
                const raw =
                  typeof u.biometrias[0].embedding_facial === "string"
                    ? JSON.parse(u.biometrias[0].embedding_facial)
                    : u.biometrias[0].embedding_facial;

                const descriptorArray = Array.isArray(raw)
                  ? raw
                  : Object.values(raw);

                if (descriptorArray.length === 128) {
                  const metaData = JSON.stringify({
                    id: u.id,
                    tipo: "usuario",
                    nombre: `${u.nombre} ${u.apellido}`,
                  });
                  faceMatcherData.push(
                    new faceapi.LabeledFaceDescriptors(metaData, [
                      new Float32Array(descriptorArray),
                    ]),
                  );
                }
              } catch (e) {
                console.warn(`Error parseando rostro usuario: ${u.nombre}`);
              }
            }
          });
        }

        if (faceMatcherData.length > 0) {
          setLabeledDescriptors(faceMatcherData);
        }

        // Llamamos a la base de datos para poblar el panel derecho
        await cargarHistorialDeHoy();

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setStream(mediaStream);
      } catch (err) {
        console.error("Error inicializando Quiosco:", err);
      }
    };
    init();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      clearInterval(scanInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (isScanningMode && labeledDescriptors.length > 0) {
      scanInterval.current = setInterval(processFrame, 800);
    } else {
      clearInterval(scanInterval.current);
    }
    return () => clearInterval(scanInterval.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanningMode, labeledDescriptors]);

  const processFrame = async () => {
    if (!videoRef.current) return;

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return;

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
      const result = faceMatcher.findBestMatch(detection.descriptor);

      if (result.label !== "unknown") {
        const personaDetectada = JSON.parse(result.label);
        registrarAsistencia(personaDetectada);
      }
    } catch (e) {
      console.warn("Error en frame de escaneo:", e);
    }
  };

  const registrarAsistencia = async (persona) => {
    const now = Date.now();
    const cooldownKey = `${persona.tipo}_${persona.id}`;
    const lastScanTime = cooldowns.current[cooldownKey];

    if (lastScanTime && now - lastScanTime < 60000) return;

    cooldowns.current[cooldownKey] = now;

    try {
      const payload =
        persona.tipo === "alumno"
          ? { id_alumno: persona.id, entidad_tipo: "alumno" }
          : { id_usuario: persona.id, entidad_tipo: "usuario" };

      const response = await AsistenciaService.marcar(payload);

      const nuevoLog = {
        id: now,
        nombre: persona.nombre,
        accion: response.accion,
        hora: new Date().toLocaleTimeString([], { hour12: false }), // Usamos formato 24h para mantener consistencia con MySQL
        estado: response.data.estado,
      };

      setLogs((prev) => [nuevoLog, ...prev].slice(0, 15));
    } catch (error) {
      if (error.message === "SILENT_IGNORE") {
        return;
      }
      console.error("Error marcando asistencia:", error);
    }
  };

  const toggleScan = () => setIsScanningMode(!isScanningMode);

  return (
    <div className="max-w-7xl mx-auto p-4 animate-fade-in flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* Columna Izquierda: Cámara */}
      <div className="w-full lg:w-2/3 flex flex-col bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScanFace className="h-6 w-6 text-blue-600" /> Quiosco Principal
          </h1>
          <button
            onClick={toggleScan}
            disabled={!modelsLoaded || labeledDescriptors.length === 0}
            className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-white transition-all ${isScanningMode ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"} shadow-lg`}
          >
            {isScanningMode ? (
              <>
                <Square className="w-4 h-4 fill-current" /> Apagar Escáner
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Iniciar Escáner
              </>
            )}
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-900 relative">
          {!modelsLoaded ? (
            <div className="text-white/50 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <p>Inicializando Motores de IA...</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-2xl rounded-2xl shadow-2xl border-4 border-slate-800 object-cover aspect-video"
                style={{ transform: "scaleX(-1)" }}
              />
              {isScanningMode && (
                <div className="absolute top-10 left-10 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 backdrop-blur text-emerald-400 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />{" "}
                  ESCANEANDO...
                </div>
              )}
              {!isScanningMode && modelsLoaded && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white text-xl font-bold">
                    El escáner está en pausa.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Columna Derecha: Historial en Vivo */}
      <div className="w-full lg:w-1/3 flex flex-col bg-white border rounded-2xl shadow-sm">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-bold flex items-center gap-2 text-slate-700">
            <UserCheck className="h-5 w-5 text-emerald-600" /> Registros de Hoy
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {logs.length === 0 ? (
            <p className="text-center text-slate-400 mt-10 text-sm">
              Esperando rostros...
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 animate-fade-in"
              >
                <div
                  className={`p-2 rounded-full shrink-0 ${log.accion === "ENTRADA" ? (log.estado === "puntual" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600") : "bg-blue-100 text-blue-600"}`}
                >
                  {log.accion === "ENTRADA" && log.estado === "tardanza" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {log.nombre}
                  </p>
                  <p
                    className={`text-xs font-bold uppercase ${log.accion === "ENTRADA" ? "text-emerald-500" : "text-blue-500"}`}
                  >
                    {log.accion}{" "}
                    {log.accion === "ENTRADA" && (
                      <span className="text-slate-400 ml-1">
                        ({log.estado})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-mono text-sm text-slate-600">
                    {log.hora}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
