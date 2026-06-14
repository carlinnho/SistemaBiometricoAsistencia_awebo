import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { HorariosService } from "../services/horarios.service";
import { AulasService } from "../services/aulas.service";

const emptyForm = {
  id_aula: "",
  hora_entrada: "",
  Hora_limite_puntual: "",
  hora_salida: "",
};

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return createPortal(
    <div
      className={`fixed bottom-5 right-5 z-200 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm max-w-sm border ${isError ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}
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
    if (
      !form.id_aula ||
      !form.hora_entrada ||
      !form.Hora_limite_puntual ||
      !form.hora_salida
    ) {
      return showToast("error", "Complete todos los campos obligatorios.");
    }
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-fade-in relative">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-blue-600" /> Gestión de
          Horarios
        </h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo Horario
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4">Aula</th>
              <th className="px-6 py-4">Hora Entrada</th>
              <th className="px-6 py-4">Límite Puntual</th>
              <th className="px-6 py-4">Hora Salida</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <Loader2 className="animate-spin mx-auto h-5 w-5 text-gray-400" />
                </td>
              </tr>
            ) : (
              data.map((d) => (
                <tr key={d.id_horario}>
                  <td className="px-6 py-4 font-medium">{d.aula?.nombre}</td>
                  <td className="px-6 py-4 text-green-600">{d.hora_entrada}</td>
                  <td className="px-6 py-4 text-blue-600">
                    {d.Hora_limite_puntual}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{d.hora_salida}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => abrirModalEditar(d)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Editar Horario" : "Nuevo Horario"}
              </h2>
              <div className="space-y-4">
                <select
                  value={form.id_aula}
                  onChange={(e) => handleChange("id_aula", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="">Seleccionar Aula...</option>
                  {aulas.map((a) => (
                    <option key={a.id_aula} value={a.id_aula}>
                      {a.nombre} - {a.grado} "{a.seccion}"
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Hora de Entrada
                    </label>
                    <input
                      type="time"
                      value={form.hora_entrada}
                      onChange={(e) =>
                        handleChange("hora_entrada", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Límite Puntual
                    </label>
                    <input
                      type="time"
                      value={form.Hora_limite_puntual}
                      onChange={(e) =>
                        handleChange("Hora_limite_puntual", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Hora de Salida
                    </label>
                    <input
                      type="time"
                      value={form.hora_salida}
                      onChange={(e) =>
                        handleChange("hora_salida", e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={cerrarModal}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                  Guardar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
