import { ToastContext } from "./toast-context";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { errorMessage, initials } from "../lib";

export function Avatar({
  name,
  id = 0,
  size = "",
}: {
  name: string;
  id?: number;
  size?: string;
}) {
  return (
    <span
      className={`person-avatar avatar-${id % 5} ${size}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
const statuses: Record<string, [string, string]> = {
  ACTIVE: ["Activa", "success"],
  EXPIRED: ["Vencida", "danger"],
  SCHEDULED: ["Programada", "info"],
  CANCELLED: ["Cancelada", "neutral"],
  PAID: ["Registrado", "success"],
  ADMIN: ["Administración", "purple"],
  TRAINER: ["Entrenador", "info"],
  MEMBER: ["Socio", "neutral"],
};
export function Badge({ value, tone }: { value: string; tone?: string }) {
  const entry = statuses[value];
  return (
    <span className={`status-badge tone-${tone || entry?.[1] || "neutral"}`}>
      <span className="status-dot" />
      {entry?.[0] || value}
    </span>
  );
}
export function PageHeading({
  eyebrow = "TU GIMNASIO, EN ORDEN",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function Empty({
  title = "Todavía no hay registros",
  description = "Cuando agregues información, la vas a encontrar acá.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading({
  label = "Cargando información…",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={25} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorNotice({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return message ? (
    <div className="error-notice" role="alert">
      <AlertCircle size={19} />
      <span>{message}</span>
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  ) : null;
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Buscar…",
  label = "Buscar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="search-box">
      <Search size={18} />
      <span className="visually-hidden">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
      />
    </label>
  );
}
export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}
export function DataTable<T extends { id: number }>({
  rows,
  columns,
  loading,
  empty,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: ReactNode;
  caption: string;
}) {
  if (loading && !rows.length) return <Loading />;
  if (!rows.length) return <>{empty || <Empty />}</>;
  return (
    <div className="table-container">
      <table className="table data-table responsive-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th key={i} scope="col" className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column, i) => (
                <td
                  key={i}
                  data-label={column.label}
                  className={column.className}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  totalPages,
  total,
  size,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="pagination-row">
      <span>
        {total
          ? `${page * size + 1}–${Math.min((page + 1) * size, total)} de ${total} registros`
          : "0 registros"}
      </span>
      <nav aria-label="Paginación" className="pagination-controls">
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <button
          className="icon-button"
          aria-label="Página siguiente"
          disabled={page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`app-dialog ${wide ? "dialog-wide" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !busy) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar ventana"
          onClick={onClose}
          disabled={busy}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export type Values = Record<string, string>;
export interface Field {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "date"
    | "select"
    | "textarea"
    | "tel";
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  minLength?: number;
  maxLength?: number;
  step?: string;
  wide?: boolean;
  help?: string;
}
export function EntityForm({
  title,
  description,
  fields,
  initial,
  submitLabel = "Guardar cambios",
  onSubmit,
  onClose,
  validate,
}: {
  title: string;
  description?: string;
  fields: Field[] | ((values: Values) => Field[]);
  initial: Values;
  submitLabel?: string;
  onSubmit: (values: Values) => Promise<void>;
  onClose: () => void;
  validate?: (values: Values) => string | undefined;
}) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const inputId = useId();
  const visibleFields = typeof fields === "function" ? fields(values) : fields;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = validate?.(values);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  return (
    <Modal
      title={title}
      description={description}
      onClose={onClose}
      busy={busy}
      wide
    >
      <form onSubmit={submit}>
        <div className="dialog-body">
          <ErrorNotice message={error} />
          <div className="row g-3">
            {visibleFields.map((field, index) => {
              const id = `${inputId}-${field.name}`,
                helpId = `${id}-help`;
              const common = {
                id,
                name: field.name,
                value: values[field.name] || "",
                required: field.required,
                disabled: busy,
                autoFocus: index === 0,
                "aria-describedby": field.help ? helpId : undefined,
                onChange: (
                  event: React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                  >,
                ) =>
                  setValues((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                    ...(field.name === "userId" &&
                    current.membershipId !== undefined
                      ? { membershipId: "" }
                      : {}),
                  })),
              };
              return (
                <div
                  key={field.name}
                  className={field.wide ? "col-12" : "col-12 col-sm-6"}
                >
                  <label htmlFor={id} className="form-label">
                    {field.label}
                    {field.required && (
                      <span className="required-mark"> *</span>
                    )}
                  </label>
                  {field.type === "select" ? (
                    <select {...common} className="form-select">
                      <option value="">Seleccionar…</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      {...common}
                      rows={6}
                      className="form-control"
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                    />
                  ) : (
                    <input
                      {...common}
                      className="form-control"
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      step={field.step}
                      autoComplete={
                        field.type === "password" ? "new-password" : "off"
                      }
                    />
                  )}
                  {field.help && (
                    <div id={helpId} className="form-text">
                      {field.help}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="dialog-footer">
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={busy}>
            {busy && <LoaderCircle size={17} className="spin" />}
            {busy ? "Guardando…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Confirm({
  title,
  description,
  actionLabel = "Confirmar",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <div className="dialog-body">
        <p>{description}</p>
        <ErrorNotice message={error} />
      </div>
      <div className="dialog-footer">
        <button className="btn btn-light" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(errorMessage(e));
              setBusy(false);
            }
          }}
        >
          {busy ? "Procesando…" : actionLabel}
        </button>
      </div>
    </Modal>
  );
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const notify = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((old) => [...old, { id, text }]);
    timers.current.push(
      setTimeout(
        () => setToasts((old) => old.filter((item) => item.id !== id)),
        5000,
      ),
    );
  };
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="app-toast" role="status">
            <Check size={19} />
            <span>{toast.text}</span>
            <button
              className="icon-button"
              aria-label="Cerrar aviso"
              onClick={() =>
                setToasts((old) => old.filter((item) => item.id !== toast.id))
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
