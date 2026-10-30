import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Check,
  CheckCheck,
  Dumbbell,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { useCommit } from "../hooks/useCommit";
import {
  Badge,
  Confirm,
  Empty,
  EntityForm,
  ErrorNotice,
  Loading,
  PageHeading,
} from "../components/ui";
import { userField } from "../components/fields";
import { dateLabel, errorMessage } from "../lib";
import type { Notification } from "../types";

export default function Notifications() {
  const { user } = useAuth(),
    data = useWorkspace(),
    commit = useCommit();
  const [filter, setFilter] = useState("all"),
    [create, setCreate] = useState(false),
    [removing, setRemoving] = useState<Notification | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const unread = data.notifications.filter((item) => !item.read),
    rows = [...data.notifications]
      .filter((item) => filter !== "unread" || !item.read)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const mark = async (ids: number[]) => {
    setBusy(true);
    setError("");
    try {
      const results = await Promise.allSettled(
        ids.map((id) => api(`/notifications/${id}/read`, { method: "PATCH" })),
      );
      await data.reload();
      if (results.some((item) => item.status === "rejected"))
        throw new Error(
          "Algunos avisos no pudieron marcarse. Intentá nuevamente.",
        );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        title="Notificaciones"
        description="Las novedades de tu gimnasio, en un solo lugar."
      >
        {user?.role !== "MEMBER" && (
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            <Plus size={18} />
            Enviar aviso
          </button>
        )}
      </PageHeading>
      <section className="surface-card notification-surface">
        <div className="notification-toolbar">
          <div
            className="segmented-control"
            aria-label="Filtrar notificaciones"
          >
            <button
              aria-pressed={filter === "all"}
              className={filter === "all" ? "selected" : ""}
              onClick={() => setFilter("all")}
            >
              Todas <span>{data.notifications.length}</span>
            </button>
            <button
              aria-pressed={filter === "unread"}
              className={filter === "unread" ? "selected" : ""}
              onClick={() => setFilter("unread")}
            >
              Sin leer <span>{unread.length}</span>
            </button>
          </div>
          <button
            className="text-link"
            disabled={busy || !unread.length}
            onClick={() => void mark(unread.map((item) => item.id))}
          >
            <CheckCheck size={17} />
            Marcar todas como leídas
          </button>
        </div>
        <ErrorNotice message={error || data.errors.notifications} />
        {data.loading && !rows.length ? (
          <Loading />
        ) : rows.length ? (
          <div className="notification-list">
            {rows.map((item) => {
              const Icon =
                item.type === "PAYMENT"
                  ? Wallet
                  : item.type === "MEMBERSHIP"
                    ? BadgeCheck
                    : item.type === "ATTENDANCE"
                      ? Activity
                      : item.type === "ROUTINE"
                        ? Dumbbell
                        : Bell;
              return (
                <article
                  className={`notification-item ${!item.read ? "unread" : ""}`}
                  key={item.id}
                >
                  <span
                    className={`notice-icon notice-${item.type.toLowerCase()}`}
                  >
                    <Icon size={22} />
                  </span>
                  <div className="notice-content">
                    <div className="notice-title">
                      <h2>{item.title}</h2>
                      {!item.read && <Badge value="Nuevo" tone="success" />}
                    </div>
                    <p>{item.message}</p>
                    <time dateTime={item.createdAt}>
                      {dateLabel(item.createdAt, true)}
                    </time>
                  </div>
                  <div className="notice-actions">
                    {!item.read && (
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={`Marcar como leída: ${item.title}`}
                        onClick={() => void mark([item.id])}
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      className="icon-button danger-button"
                      aria-label={`Eliminar aviso: ${item.title}`}
                      onClick={() => setRemoving(item)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            title={
              filter === "unread" ? "Estás al día" : "Tu bandeja está tranquila"
            }
            description={
              filter === "unread"
                ? "No tenés notificaciones pendientes de lectura."
                : "Los avisos y confirmaciones de tu gimnasio van a aparecer acá."
            }
          />
        )}
      </section>
      {create && (
        <EntityForm
          title="Enviar un aviso"
          description="El socio lo va a recibir en sus notificaciones personales."
          initial={{ userId: "", title: "", message: "", type: "INFO" }}
          fields={[
            userField(data.users),
            {
              name: "title",
              label: "Título",
              required: true,
              wide: true,
              maxLength: 200,
            },
            {
              name: "message",
              label: "Mensaje",
              type: "textarea",
              required: true,
              wide: true,
              maxLength: 3000,
            },
            {
              name: "type",
              label: "Tipo de aviso",
              type: "select",
              required: true,
              options: [
                { value: "INFO", label: "Información general" },
                { value: "ROUTINE", label: "Entrenamiento" },
                { value: "MEMBERSHIP", label: "Membresía" },
              ],
            },
          ]}
          submitLabel="Enviar aviso"
          onClose={() => setCreate(false)}
          onSubmit={(values) =>
            commit(
              () =>
                api("/notifications", {
                  method: "POST",
                  body: JSON.stringify({
                    ...values,
                    userId: Number(values.userId),
                  }),
                }),
              "El aviso se envió al socio.",
            )
          }
        />
      )}
      {removing && (
        <Confirm
          title="Eliminar notificación"
          description={`El aviso “${removing.title}” dejará de aparecer en tu bandeja.`}
          actionLabel="Eliminar aviso"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            commit(
              () => api(`/notifications/${removing.id}`, { method: "DELETE" }),
              "El aviso se eliminó.",
            )
          }
        />
      )}
    </>
  );
}
