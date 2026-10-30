import { useState } from "react";
import { Activity, Clock3, LogIn, LogOut, Plus, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { useCommit } from "../hooks/useCommit";
import {
  Avatar,
  Badge,
  Confirm,
  DataTable,
  Empty,
  EntityForm,
  ErrorNotice,
  PageHeading,
  SearchBox,
} from "../components/ui";
import { userField } from "../components/fields";
import {
  contains,
  dateLabel,
  duration,
  errorMessage,
  timeLabel,
  today,
} from "../lib";
import type { Attendance as Visit } from "../types";

export default function Attendance() {
  const { user } = useAuth(),
    data = useWorkspace(),
    commit = useCommit();
  const staff = user?.role !== "MEMBER";
  const [q, setQ] = useState(""),
    [day, setDay] = useState(""),
    [scope, setScope] = useState("all"),
    [create, setCreate] = useState(false),
    [busy, setBusy] = useState<number | null>(null),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState<Visit | null>(null);
  const present = data.attendance.filter((item) => !item.checkOut),
    ownOpen = present.find((item) => item.userId === user?.id);
  const rows = [...data.attendance]
    .filter(
      (item) =>
        (!day || item.checkIn.startsWith(day)) &&
        (scope === "all" ||
          (scope === "open" ? !item.checkOut : !!item.checkOut)) &&
        contains(q, data.nameOf(item.userId)),
    )
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const checkIn = (id: number) =>
    commit(
      () =>
        api("/attendance/check-in", {
          method: "POST",
          body: JSON.stringify({ userId: id }),
        }),
      "El ingreso se registró. ¡Buen entrenamiento!",
    );
  const checkOut = async (id: number) => {
    setBusy(id);
    setError("");
    try {
      await commit(
        () => api(`/attendance/check-out/${id}`, { method: "PUT" }),
        "Salida registrada. ¡Nos vemos en el próximo entrenamiento!",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageHeading
        title={staff ? "Asistencias" : "Mis asistencias"}
        description={
          staff
            ? "Cada visita suma. Gestioná los ingresos y acompañá cada entrenamiento."
            : "Tu constancia, visita a visita. Registrá tu ingreso y tu salida."
        }
      >
        {staff ? (
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            <Plus size={18} />
            Registrar ingreso
          </button>
        ) : ownOpen ? (
          <button
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={() => void checkOut(ownOpen.id)}
          >
            <LogOut size={18} />
            Registrar mi salida
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={async () => {
              setBusy(0);
              setError("");
              try {
                await checkIn(user!.id);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(null);
              }
            }}
          >
            <LogIn size={18} />
            Registrar mi ingreso
          </button>
        )}
      </PageHeading>
      <ErrorNotice message={error || data.errors.attendance} />
      <div className="attendance-summary">
        <section className="present-panel">
          <span className="live-tag">
            <span />
            {staff ? "EN EL GIMNASIO AHORA" : "MI ESTADO ACTUAL"}
          </span>
          <div>
            <strong>
              {staff
                ? present.length
                : ownOpen
                  ? "Entrenando"
                  : "Sin ingreso abierto"}
            </strong>
            {staff && (
              <span>
                {present.length === 1
                  ? "persona entrenando"
                  : "personas entrenando"}
              </span>
            )}
          </div>
          {present.length > 0 ? (
            <div className="present-avatars">
              {present.slice(0, 6).map((item) => (
                <span key={item.id} title={data.nameOf(item.userId)}>
                  <Avatar name={data.nameOf(item.userId)} id={item.userId} />
                </span>
              ))}
              {present.length > 6 && (
                <span className="avatar-overflow">+{present.length - 6}</span>
              )}
            </div>
          ) : (
            <p>Listo para el próximo entrenamiento.</p>
          )}
          <button className="text-link" onClick={() => setScope("open")}>
            Ver ingresos abiertos <Activity size={16} />
          </button>
        </section>
        <section className="surface-card small-stat">
          <span className="stat-icon">
            <LogIn size={22} />
          </span>
          <span>Visitas de hoy</span>
          <strong>
            {
              data.attendance.filter((item) => item.checkIn.startsWith(today()))
                .length
            }
          </strong>
          <p>Ingresos registrados en el día</p>
        </section>
        <section className="surface-card small-stat">
          <span className="stat-icon">
            <Clock3 size={22} />
          </span>
          <span>Visitas registradas</span>
          <strong>{data.attendance.length}</strong>
          <p>Tu historial de movimiento</p>
        </section>
      </div>
      <section className="surface-card">
        <div className="section-heading">
          <div>
            <h2>Historial de asistencias</h2>
            <p>Ingresos y salidas, en un solo lugar</p>
          </div>
        </div>
        <div className="list-toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Buscar socio…"
            label="Buscar asistencias"
          />
          <div className="toolbar-filters">
            <input
              type="date"
              className="form-control filter-select"
              aria-label="Filtrar por fecha"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
            <select
              className="form-select filter-select"
              aria-label="Estado de la asistencia"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="all">Todas las visitas</option>
              <option value="open">Ingresos abiertos</option>
              <option value="closed">Finalizadas</option>
            </select>
          </div>
        </div>
        <DataTable
          caption="Historial de asistencias"
          rows={rows}
          loading={data.loading}
          empty={
            <Empty
              title="Sin visitas en esta vista"
              description="Registrá un ingreso o cambiá los filtros para ver el historial."
            />
          }
          columns={[
            {
              label: "Socio",
              render: (item) => (
                <div className="person-cell">
                  <Avatar name={data.nameOf(item.userId)} id={item.userId} />
                  <span>
                    <strong>{data.nameOf(item.userId)}</strong>
                    <small>Visita #{item.id}</small>
                  </span>
                </div>
              ),
            },
            { label: "Fecha", render: (item) => dateLabel(item.checkIn) },
            {
              label: "Ingreso",
              render: (item) => (
                <span className="time-cell">
                  <LogIn size={14} />
                  {timeLabel(item.checkIn)}
                </span>
              ),
            },
            {
              label: "Salida",
              render: (item) =>
                item.checkOut ? (
                  <span className="time-cell">
                    <LogOut size={14} />
                    {timeLabel(item.checkOut)}
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              label: "Duración",
              render: (item) =>
                item.checkOut ? (
                  duration(item.checkIn, item.checkOut)
                ) : (
                  <Badge value="Entrenando" tone="success" />
                ),
            },
            {
              label: "Acciones",
              className: "actions-cell",
              render: (item) => (
                <div className="row-actions">
                  {!item.checkOut && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={busy !== null}
                      onClick={() => void checkOut(item.id)}
                    >
                      <LogOut size={14} />
                      {busy === item.id ? "Registrando…" : "Salida"}
                    </button>
                  )}
                  {staff && (
                    <button
                      className="icon-button danger-button"
                      aria-label={`Eliminar asistencia ${item.id}`}
                      onClick={() => setRemoving(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <div className="list-footnote">{rows.length} visitas en esta vista</div>
      </section>
      {create && (
        <EntityForm
          title="Registrar ingreso"
          description="El socio necesita una membresía vigente y no puede tener otro ingreso abierto."
          fields={[
            userField(
              data.users.filter(
                (item) => !present.some((visit) => visit.userId === item.id),
              ),
            ),
          ]}
          initial={{ userId: "" }}
          submitLabel="Registrar ingreso"
          onClose={() => setCreate(false)}
          onSubmit={(values) => checkIn(Number(values.userId))}
        />
      )}
      {removing && (
        <Confirm
          title="Eliminar asistencia"
          description={`La visita de ${data.nameOf(removing.userId)} del ${dateLabel(removing.checkIn, true)} dejará de aparecer en el historial activo.`}
          actionLabel="Eliminar registro"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            commit(
              () => api(`/attendance/${removing.id}`, { method: "DELETE" }),
              "La asistencia se eliminó.",
            )
          }
        />
      )}
    </>
  );
}
