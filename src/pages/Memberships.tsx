import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { api, save } from "../api";
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
  dateAfter,
  dateLabel,
  errorMessage,
  fullName,
  money,
  today,
} from "../lib";
import type { Membership } from "../types";

export default function Memberships() {
  const { user } = useAuth(),
    data = useWorkspace(),
    commit = useCommit();
  const admin = user?.role === "ADMIN",
    trainer = user?.role === "TRAINER";
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [selectedUser, setSelectedUser] = useState(String(user?.id || ""));
  const [scoped, setScoped] = useState<Membership[]>([]),
    [scopedLoading, setScopedLoading] = useState(false),
    [scopedError, setScopedError] = useState("");
  const [editing, setEditing] = useState<Membership | "new" | null>(null),
    [removing, setRemoving] = useState<Membership | null>(null);
  useEffect(() => {
    if (!trainer || !selectedUser) return;
    const controller = new AbortController();
    setScopedLoading(true);
    setScopedError("");
    api<Membership[]>(`/memberships/user/${selectedUser}`, {
      signal: controller.signal,
    })
      .then(setScoped)
      .catch((e) => {
        if (!controller.signal.aborted) setScopedError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setScopedLoading(false);
      });
    return () => controller.abort();
  }, [trainer, selectedUser, data.memberships]);
  const memberships = trainer ? scoped : data.memberships;
  const rows = memberships.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      contains(query, data.nameOf(item.userId), item.planName),
  );
  const edited = editing && editing !== "new" ? editing : null;
  return (
    <>
      <PageHeading
        title={user?.role === "MEMBER" ? "Mi membresía" : "Membresías"}
        description={
          user?.role === "MEMBER"
            ? "Tu plan, su vigencia y todo lo que necesitás saber para seguir entrenando."
            : "Cada plan al día. Acompañá la continuidad de tus socios."
        }
      >
        {admin && (
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Nueva membresía
          </button>
        )}
      </PageHeading>
      {user?.role === "MEMBER" && (
        <div className="membership-cards">
          {memberships
            .filter((item) => item.status === "ACTIVE")
            .map((item) => (
              <section className="membership-highlight" key={item.id}>
                <div>
                  <span className="eyebrow">TU PLAN VIGENTE</span>
                  <h2>{item.planName}</h2>
                  <p>
                    <CalendarDays size={17} />
                    Hasta el {dateLabel(item.endDate)}
                  </p>
                </div>
                <BadgeCheck size={56} strokeWidth={1.4} />
                <Badge value={item.status} />
              </section>
            ))}
        </div>
      )}
      <section className="surface-card">
        <div className="list-toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Buscar socio o plan…"
            label="Buscar membresías"
          />
          <div className="toolbar-filters">
            {trainer && (
              <select
                className="form-select filter-select"
                aria-label="Consultar membresías de un socio"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                {data.users
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {fullName(item)}
                    </option>
                  ))}
              </select>
            )}
            <select
              className="form-select filter-select"
              aria-label="Filtrar membresías por estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="EXPIRED">Vencidas</option>
              <option value="SCHEDULED">Programadas</option>
            </select>
          </div>
        </div>
        <ErrorNotice message={scopedError || data.errors.memberships} />
        <DataTable
          caption="Membresías"
          rows={rows}
          loading={data.loading || scopedLoading}
          empty={
            <Empty
              title="No hay membresías para mostrar"
              description={
                admin
                  ? "Creá una membresía para que tu socio pueda empezar a entrenar."
                  : "Consultá a la administración para conocer los planes disponibles."
              }
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
                    <small>Membresía #{item.id}</small>
                  </span>
                </div>
              ),
            },
            {
              label: "Plan",
              render: (item) => (
                <strong className="cell-title">{item.planName}</strong>
              ),
            },
            {
              label: "Vigencia",
              render: (item) => (
                <span className="stacked-cell">
                  <span>{dateLabel(item.startDate)}</span>
                  <small>al {dateLabel(item.endDate)}</small>
                </span>
              ),
            },
            { label: "Importe", render: (item) => money(item.price) },
            {
              label: "Estado",
              render: (item) => <Badge value={item.status} />,
            },
            ...(admin
              ? [
                  {
                    label: "Acciones",
                    className: "actions-cell",
                    render: (item: Membership) => (
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar membresía ${item.id}`}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button danger-button"
                          aria-label={`Cancelar membresía ${item.id}`}
                          onClick={() => setRemoving(item)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
        <div className="list-footnote">
          {rows.length} membresías · Importes expresados en ARS
        </div>
      </section>
      {editing && (
        <EntityForm
          title={edited ? "Editar membresía" : "Nueva membresía"}
          description="Definí el plan y las fechas que habilitan el acceso al gimnasio."
          initial={{
            userId: edited?.userId.toString() || "",
            planName: edited?.planName || "",
            price: edited?.price.toString() || "",
            startDate: edited?.startDate || today(),
            endDate: edited?.endDate || dateAfter(30),
          }}
          fields={(values) => [
            userField(data.users),
            {
              name: "planName",
              label: "Nombre del plan",
              required: true,
              wide: true,
              placeholder: "Ej. Mensual · Pase libre",
              maxLength: 100,
            },
            {
              name: "price",
              label: "Importe (ARS)",
              type: "number",
              required: true,
              min: 0,
              step: "0.01",
            },
            {
              name: "startDate",
              label: "Fecha de inicio",
              type: "date",
              required: true,
            },
            {
              name: "endDate",
              label: "Fecha de vencimiento",
              type: "date",
              required: true,
              min: values.startDate,
            },
          ]}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            commit(
              () =>
                save(
                  "/memberships",
                  {
                    ...values,
                    userId: Number(values.userId),
                    price: Number(values.price),
                  },
                  edited?.id,
                ),
              "La membresía se guardó correctamente.",
            )
          }
        />
      )}
      {removing && (
        <Confirm
          title="Cancelar membresía"
          description={`La membresía ${removing.planName} de ${data.nameOf(removing.userId)} dejará de habilitar el acceso. Su historial se conservará.`}
          actionLabel="Cancelar membresía"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            commit(
              () => api(`/memberships/${removing.id}`, { method: "DELETE" }),
              "La membresía se canceló.",
            )
          }
        />
      )}
    </>
  );
}
