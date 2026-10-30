import { useState } from "react";
import {
  Banknote,
  CreditCard,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
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
  PageHeading,
  SearchBox,
} from "../components/ui";
import { userField } from "../components/fields";
import { contains, dateLabel, money, today } from "../lib";
import type { Payment } from "../types";

const methods: Record<string, string> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  CARD: "Tarjeta",
};
export default function Payments() {
  const { user } = useAuth(),
    data = useWorkspace(),
    commit = useCommit();
  const admin = user?.role === "ADMIN";
  const [q, setQ] = useState(""),
    [month, setMonth] = useState(""),
    [method, setMethod] = useState("all");
  const [editing, setEditing] = useState<Payment | "new" | null>(null),
    [removing, setRemoving] = useState<Payment | null>(null);
  const edited = editing && editing !== "new" ? editing : null;
  const rows = [...data.payments]
    .filter(
      (item) =>
        (!month || item.paymentDate.startsWith(month)) &&
        (method === "all" || item.paymentMethod === method) &&
        contains(
          q,
          data.nameOf(item.userId),
          item.id,
          methods[item.paymentMethod] || item.paymentMethod,
        ),
    )
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.id - a.id);
  const current = data.payments.filter((item) =>
    item.paymentDate.startsWith(today().slice(0, 7)),
  );
  return (
    <>
      <PageHeading
        title={admin ? "Pagos" : "Mis pagos"}
        description={
          admin
            ? "Cada pago, registrado. Más claridad para vos y tus socios."
            : "El detalle de tus pagos y las membresías asociadas."
        }
      >
        {admin && (
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Registrar pago
          </button>
        )}
      </PageHeading>
      <div className="payment-summary">
        <div className="payment-summary-icon">
          <Wallet size={25} />
        </div>
        <div>
          <span>
            {admin ? "Ingresos registrados este mes" : "Mis pagos de este mes"}
          </span>
          <strong>
            {money(current.reduce((sum, item) => sum + item.amount, 0))}
            <small>ARS</small>
          </strong>
        </div>
        <span className="subtle-pill">
          {current.length}{" "}
          {current.length === 1 ? "pago registrado" : "pagos registrados"}
        </span>
      </div>
      <section className="surface-card">
        <div className="list-toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Buscar socio o número de pago…"
            label="Buscar pagos"
          />
          <div className="toolbar-filters">
            <input
              type="month"
              className="form-control filter-select"
              aria-label="Filtrar pagos por mes"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <select
              className="form-select filter-select"
              aria-label="Medio de pago"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="all">Todos los medios</option>
              {Object.entries(methods).map(([key, value]) => (
                <option value={key} key={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          caption="Pagos registrados"
          rows={rows}
          loading={data.loading}
          empty={
            <Empty
              title="No hay pagos para mostrar"
              description="Los pagos registrados en el gimnasio van a aparecer acá."
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
                    <small>Pago #{String(item.id).padStart(4, "0")}</small>
                  </span>
                </div>
              ),
            },
            { label: "Fecha", render: (item) => dateLabel(item.paymentDate) },
            {
              label: "Membresía",
              render: (item) =>
                data.memberships.find((plan) => plan.id === item.membershipId)
                  ?.planName || `Membresía #${item.membershipId}`,
            },
            {
              label: "Medio",
              render: (item) => (
                <span className="method-cell">
                  {item.paymentMethod === "CASH" ? (
                    <Banknote size={16} />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  {methods[item.paymentMethod] || item.paymentMethod}
                </span>
              ),
            },
            {
              label: "Importe",
              render: (item) => (
                <strong className="amount-cell">{money(item.amount)}</strong>
              ),
            },
            {
              label: "Estado",
              render: (item) => <Badge value={item.status} />,
            },
            ...(admin
              ? [
                  {
                    label: "Acciones",
                    className: "actions-cell",
                    render: (item: Payment) => (
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar pago ${item.id}`}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger-button"
                          aria-label={`Anular pago ${item.id}`}
                          onClick={() => setRemoving(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
        <div className="list-footnote">
          <span>{rows.length} pagos · Importes en ARS</span>
          <strong>
            Total de esta vista:{" "}
            {money(rows.reduce((sum, item) => sum + item.amount, 0))}
          </strong>
        </div>
      </section>
      {editing && (
        <EntityForm
          title={edited ? "Editar pago" : "Registrar un pago"}
          description="Este registro deja constancia del pago; no realiza un cobro externo."
          initial={{
            userId: edited?.userId.toString() || "",
            membershipId: edited?.membershipId.toString() || "",
            amount: edited?.amount.toString() || "",
            paymentMethod: edited?.paymentMethod || "CASH",
          }}
          fields={(values) => [
            userField(data.users),
            {
              name: "membershipId",
              label: "Membresía asociada",
              type: "select",
              required: true,
              wide: true,
              options: data.memberships
                .filter(
                  (item) =>
                    item.userId === Number(values.userId) && item.active,
                )
                .map((item) => ({
                  value: item.id,
                  label: `${item.planName} · #${item.id} · ${money(item.price)}`,
                })),
              help:
                values.userId &&
                !data.memberships.some(
                  (item) =>
                    item.userId === Number(values.userId) && item.active,
                )
                  ? "Este socio no tiene una membresía disponible. Creá una antes de registrar el pago."
                  : "Elegí primero el socio para ver sus membresías.",
            },
            {
              name: "amount",
              label: "Importe (ARS)",
              type: "number",
              required: true,
              min: "0.01",
              step: "0.01",
            },
            {
              name: "paymentMethod",
              label: "Medio de pago",
              type: "select",
              required: true,
              options: Object.entries(methods).map(([value, label]) => ({
                value,
                label,
              })),
            },
          ]}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            commit(
              () =>
                save(
                  "/payments",
                  {
                    userId: Number(values.userId),
                    membershipId: Number(values.membershipId),
                    amount: Number(values.amount),
                    paymentMethod: values.paymentMethod,
                  },
                  edited?.id,
                ),
              "El pago quedó registrado.",
            )
          }
        />
      )}
      {removing && (
        <Confirm
          title="Anular registro de pago"
          description={`El pago de ${money(removing.amount)} de ${data.nameOf(removing.userId)} dejará de aparecer en los registros activos. Esto no realiza una devolución de dinero.`}
          actionLabel="Anular registro"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            commit(
              () => api(`/payments/${removing.id}`, { method: "DELETE" }),
              "El registro de pago se anuló.",
            )
          }
        />
      )}
    </>
  );
}
