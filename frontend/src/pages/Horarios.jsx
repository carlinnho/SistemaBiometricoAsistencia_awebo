import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HorariosService } from "../services/horarios.service";
import { AulasService } from "../services/aulas.service";

const emptyForm = {
  id_aula: "",
  hora_entrada: "",
  Hora_limite_puntual: "",
  hora_salida: "",
};

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

/* ─── TIME BADGE ─── */
function TimeBadge({ time, variant }) {
  const styles = {
    entrada: "bg-green-50 text-green-700 border-green-200",
    limite: "bg-orange-50 text-orange-700 border-orange-200",
    salida: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[variant]}`}
    >
      {time}
    </span>
  );
}

/* ─── PAGINATION ─── */
function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Build page number array: always show first, last, current ±1, with ellipsis
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
        <span className="font-semibold text-gray-600">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-semibold text-gray-600">{totalItems}</span>{" "}
        horario{totalItems !== 1 ? "s" : ""}
      </p>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {/* Flecha izquierda */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} text-gray-400 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Números */}
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

        {/* Flecha derecha */}
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
export default function Horarios() {
  const [data, setData] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listaHorarios, listaAulas] = await Promise.all([
        HorariosService.getAll(),
        AulasService.getAll(),
      ]);
      setData(Array.isArray(listaHorarios) ? listaHorarios : []);
      setAulas(Array.isArray(listaAulas) ? listaAulas : []);
      setCurrentPage(1);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Datos paginados
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (
      !form.id_aula ||
      !form.hora_entrada ||
      !form.Hora_limite_puntual ||
      !form.hora_salida
    )
      return showToast("error", "Complete todos los campos obligatorios.");

    const payload = { ...form, id_aula: Number(form.id_aula) };
    setIsSaving(true);
    try {
      if (isEditing) await HorariosService.update(editingId, payload);
      else await HorariosService.create(payload);
      showToast(
        "success",
        `Horario ${isEditing ? "actualizado" : "registrado"} correctamente.`,
      );
      cerrarModal();
      await cargarDatos();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const abrirModalEditar = (horario) => {
    setForm({
      id_aula: horario.id_aula,
      hora_entrada: horario.hora_entrada.slice(0, 5),
      Hora_limite_puntual: horario.Hora_limite_puntual.slice(0, 5),
      hora_salida: horario.hora_salida.slice(0, 5),
    });
    setEditingId(horario.id_horario);
    setIsEditing(true);
    setOpen(true);
  };

  const cerrarModal = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setEditingId(null);
    setOpen(false);
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm";

  const labelCls =
    "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ─── HEADER ─── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
            <CalendarClock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Gestión de Horarios
            </h1>
            <p className="text-xs text-gray-400">
              Configura los horarios de entrada y salida por aula.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nuevo Horario
        </button>
      </div>

      {/* ─── TABLA ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Aula
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Hora Entrada
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Límite Puntual
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                Hora Salida
              </th>
              <th className="px-6 py-3.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <Loader2 className="animate-spin mx-auto h-7 w-7 text-orange-500 mb-2" />
                  <p className="text-sm text-gray-400">Cargando horarios...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CalendarClock className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">
                    No hay horarios registrados.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((d) => (
                <tr
                  key={d.id_horario}
                  className="hover:bg-orange-50/40 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {d.aula?.nombre}
                  </td>
                  <td className="px-6 py-4">
                    <TimeBadge time={d.hora_entrada} variant="entrada" />
                  </td>
                  <td className="px-6 py-4">
                    <TimeBadge time={d.Hora_limite_puntual} variant="limite" />
                  </td>
                  <td className="px-6 py-4">
                    <TimeBadge time={d.hora_salida} variant="salida" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => abrirModalEditar(d)}
                        title="Editar Horario"
                        className="p-2 rounded-xl text-orange-500 hover:bg-orange-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ─── PAGINACIÓN ─── */}
        {!isLoading && data.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={data.length}
            pageSize={PAGE_SIZE}
          />
        )}
      </div>

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
                      <CalendarClock className="h-4 w-4 text-orange-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isEditing ? "Editar Horario" : "Nuevo Horario"}
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
                    <label className={labelCls}>Aula</label>
                    <select
                      value={form.id_aula}
                      onChange={(e) => handleChange("id_aula", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Seleccionar Aula...</option>
                      {aulas.map((a) => (
                        <option key={a.id_aula} value={a.id_aula}>
                          {a.nombre} — {a.grado} "{a.seccion}"
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Hora Entrada</label>
                      <input
                        type="time"
                        value={form.hora_entrada}
                        onChange={(e) =>
                          handleChange("hora_entrada", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Límite Puntual</label>
                      <input
                        type="time"
                        value={form.Hora_limite_puntual}
                        onChange={(e) =>
                          handleChange("Hora_limite_puntual", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Hora Salida</label>
                      <input
                        type="time"
                        value={form.hora_salida}
                        onChange={(e) =>
                          handleChange("hora_salida", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>
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
                    Guardar Horario
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