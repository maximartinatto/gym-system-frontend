import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
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
  Modal,
  PageHeading,
  Pagination,
  SearchBox,
} from "../components/ui";
import type { Field, Values } from "../components/ui";
import { errorMessage, fullName } from "../lib";
import type { User, UserPage } from "../types";

function exportUsers(users: User[]) {
  const cell = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replace(/"/g, '""')}"`;
  const csv = [
    ["Nombre", "Apellido", "Email", "Teléfono", "Perfil", "Estado"],
    ...users.map((user) => [
      user.firstName,
      user.lastName,
      user.email,
      user.phone,
      user.role,
      user.active ? "Activo" : "Inactivo",
    ]),
  ]
    .map((row) => row.map(cell).join(";"))
    .join("\r\n");
  const link = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
  link.href = url;
  link.download = "socios-pagina.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Users() {
  const { user } = useAuth(),
    workspace = useWorkspace(),
    commit = useCommit();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || ""),
    [query, setQuery] = useState(q),
    [active, setActive] = useState("true"),
    [page, setPage] = useState(0),
    [version, setVersion] = useState(0);
  const [result, setResult] = useState<UserPage | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [editing, setEditing] = useState<User | "new" | null>(null),
    [viewing, setViewing] = useState<User | null>(null),
    [removing, setRemoving] = useState<User | null>(null);
  const admin = user?.role === "ADMIN";
  useEffect(() => {
    setQ(params.get("q") || "");
    if (params.get("nuevo") && admin) setEditing("new");
  }, [params, admin]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(q);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const search = new URLSearchParams({
      q: query,
      page: String(page),
      size: "10",
    });
    if (active !== "all") search.set("active", active);
    api<UserPage>(`/users/search?${search}`, { signal: abort.signal })
      .then(setResult)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [query, active, page, version]);
  const closeForm = () => {
    setEditing(null);
    if (params.has("nuevo")) {
      params.delete("nuevo");
      setParams(params, { replace: true });
    }
  };
  const edited = editing && editing !== "new" ? editing : null;
  const fields: Field[] = [
    {
      name: "firstName",
      label: "Nombre",
      required: true,
      minLength: 2,
      maxLength: 50,
      placeholder: "Ej. Martina",
    },
    {
      name: "lastName",
      label: "Apellido",
      required: true,
      minLength: 2,
      maxLength: 50,
      placeholder: "Ej. González",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      wide: true,
      placeholder: "nombre@correo.com",
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "tel",
      placeholder: "Ej. 11 5555 1234",
    },
    { name: "age", label: "Edad", type: "number", min: 14, max: 100 },
    {
      name: "role",
      label: "Perfil de acceso",
      type: "select",
      required: true,
      options: [
        { value: "MEMBER", label: "Socio" },
        { value: "TRAINER", label: "Entrenador" },
        { value: "ADMIN", label: "Administración" },
      ],
    },
    {
      name: "password",
      label: edited ? "Nueva contraseña (opcional)" : "Contraseña inicial",
      type: "password",
      required: !edited,
      minLength: 8,
      maxLength: 72,
      help: edited
        ? "Dejá este campo vacío para conservar la actual."
        : "Al menos 8 caracteres.",
    },
  ];
  const submit = async (values: Values) => {
    await commit(
      () =>
        save(
          "/users",
          {
            ...values,
            age: values.age ? Number(values.age) : null,
            ...(values.password
              ? { password: values.password }
              : { password: undefined }),
          },
          edited?.id,
        ),
      edited
        ? "Los datos del socio se actualizaron."
        : "El socio ya forma parte de tu gimnasio.",
    );
    setVersion((v) => v + 1);
  };
  return (
    <>
      <PageHeading
        title="Socios"
        description="Personas que entrenan, un equipo que acompaña. Tu comunidad, acá."
      >
        <button
          className="btn btn-outline-secondary"
          onClick={() => exportUsers(result?.content || [])}
          disabled={!result?.content.length}
        >
          <Download size={17} />
          Exportar página
        </button>
        {admin && (
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Nuevo socio
          </button>
        )}
      </PageHeading>
      <div className="inline-stats">
        <span>
          <UsersRound size={18} />
          <strong>
            {
              workspace.users.filter(
                (item) => item.active && item.role === "MEMBER",
              ).length
            }
          </strong>{" "}
          socios activos
        </span>
        <span>
          <span className="small-dot dot-teal" />
          <strong>
            {
              workspace.users.filter(
                (item) => item.active && item.role === "TRAINER",
              ).length
            }
          </strong>{" "}
          entrenadores
        </span>
      </div>
      <section className="surface-card">
        <div className="list-toolbar">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Buscar por nombre, apellido o email…"
            label="Buscar socios"
          />
          <div className="toolbar-filters">
            <label className="visually-hidden" htmlFor="user-active-filter">
              Estado de los socios
            </label>
            <select
              id="user-active-filter"
              className="form-select filter-select"
              value={active}
              onChange={(event) => {
                setActive(event.target.value);
                setPage(0);
              }}
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
              <option value="all">Todos los estados</option>
            </select>
            <span className="result-count">
              {result?.totalElements ?? 0} registros
            </span>
          </div>
        </div>
        <ErrorNotice message={error} onRetry={() => setVersion((v) => v + 1)} />
        <DataTable
          caption="Socios del gimnasio"
          rows={result?.content || []}
          loading={loading}
          empty={
            <Empty
              title={
                query
                  ? "No encontramos coincidencias"
                  : "Tu comunidad empieza acá"
              }
              description={
                query
                  ? "Probá con otro nombre o email."
                  : "Agregá el primer socio para empezar a gestionar tu gimnasio."
              }
            />
          }
          columns={[
            {
              label: "Socio",
              render: (item) => (
                <button
                  className="person-cell row-link"
                  onClick={() => setViewing(item)}
                >
                  <Avatar name={fullName(item)} id={item.id} />
                  <span>
                    <strong>{fullName(item)}</strong>
                    <small>#{String(item.id).padStart(4, "0")}</small>
                  </span>
                </button>
              ),
            },
            {
              label: "Contacto",
              render: (item) => (
                <span className="stacked-cell">
                  <span>{item.email}</span>
                  <small>{item.phone || "Sin teléfono"}</small>
                </span>
              ),
            },
            { label: "Perfil", render: (item) => <Badge value={item.role} /> },
            {
              label: "Estado",
              render: (item) => (
                <Badge
                  value={item.active ? "Activo" : "Inactivo"}
                  tone={item.active ? "success" : "neutral"}
                />
              ),
            },
            {
              label: "Acciones",
              className: "actions-cell",
              render: (item) => (
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Ver a ${fullName(item)}`}
                    onClick={() => setViewing(item)}
                  >
                    <Eye size={17} />
                  </button>
                  {admin && (
                    <>
                      <button
                        className="icon-button"
                        aria-label={`Editar a ${fullName(item)}`}
                        onClick={() => setEditing(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger-button"
                        aria-label={`Desactivar a ${fullName(item)}`}
                        onClick={() => setRemoving(item)}
                        disabled={!item.active || item.id === user?.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination
          page={page}
          size={10}
          totalPages={result?.totalPages || 0}
          total={result?.totalElements || 0}
          onChange={setPage}
        />
      </section>
      {editing && (
        <EntityForm
          title={edited ? "Editar socio" : "Un nuevo comienzo"}
          description={
            edited
              ? "Actualizá la información de esta cuenta."
              : "Agregá una persona a tu gimnasio y elegí su acceso."
          }
          fields={fields}
          initial={{
            firstName: edited?.firstName || "",
            lastName: edited?.lastName || "",
            email: edited?.email || "",
            phone: edited?.phone || "",
            age: edited?.age?.toString() || "",
            role: edited?.role || "MEMBER",
            password: "",
          }}
          submitLabel={edited ? "Guardar cambios" : "Crear cuenta"}
          onSubmit={submit}
          onClose={closeForm}
        />
      )}
      {viewing && (
        <Modal
          title={fullName(viewing)}
          description={`Cuenta #${viewing.id}`}
          onClose={() => setViewing(null)}
        >
          <div className="dialog-body">
            <div className="person-detail-head">
              <Avatar
                name={fullName(viewing)}
                id={viewing.id}
                size="avatar-large"
              />
              <Badge value={viewing.role} />
            </div>
            <dl className="detail-list">
              <div>
                <dt>Email</dt>
                <dd>{viewing.email}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{viewing.phone || "No registrado"}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>{viewing.age ? `${viewing.age} años` : "No registrada"}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{viewing.active ? "Activo" : "Inactivo"}</dd>
              </div>
            </dl>
          </div>
          <div className="dialog-footer">
            <button className="btn btn-light" onClick={() => setViewing(null)}>
              Cerrar
            </button>
            {admin && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
              >
                Editar socio
              </button>
            )}
          </div>
        </Modal>
      )}
      {removing && (
        <Confirm
          title="Desactivar cuenta"
          description={`${fullName(removing)} dejará de tener acceso. Su historial se conservará.`}
          actionLabel="Desactivar"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await commit(
              () => api(`/users/${removing.id}`, { method: "DELETE" }),
              "La cuenta se desactivó.",
            );
            setVersion((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
