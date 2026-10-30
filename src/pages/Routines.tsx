import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Dumbbell,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { api, save } from "../api";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { useCommit } from "../hooks/useCommit";
import {
  Avatar,
  Confirm,
  Empty,
  EntityForm,
  Loading,
  Modal,
  PageHeading,
  SearchBox,
} from "../components/ui";
import { userField } from "../components/fields";
import { contains, fullName } from "../lib";
import type { Routine } from "../types";

export default function Routines() {
  const { user } = useAuth(),
    data = useWorkspace(),
    commit = useCommit();
  const staff = user?.role !== "MEMBER",
    [params, setParams] = useSearchParams();
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState("all"),
    [editing, setEditing] = useState<Routine | "new" | null>(null),
    [viewing, setViewing] = useState<Routine | null>(null),
    [removing, setRemoving] = useState<Routine | null>(null);
  useEffect(() => {
    if (params.has("nueva") && staff) setEditing("new");
  }, [params, staff]);
  const close = () => {
    setEditing(null);
    if (params.has("nueva")) {
      params.delete("nueva");
      setParams(params, { replace: true });
    }
  };
  const edited = editing && editing !== "new" ? editing : null;
  const rows = data.routines.filter(
    (item) =>
      (selected === "all" || item.userId === Number(selected)) &&
      contains(
        q,
        item.title,
        item.description,
        item.trainerName,
        data.nameOf(item.userId),
      ),
  );
  return (
    <>
      <PageHeading
        title={staff ? "Rutinas" : "Mis rutinas"}
        description={
          staff
            ? "Entrenamientos con propósito, pensados para cada persona."
            : "Tu guía para seguir avanzando. Encontrá tu próximo entrenamiento."
        }
      >
        {staff && (
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Nueva rutina
          </button>
        )}
      </PageHeading>
      <div className="routines-toolbar">
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Buscar rutina, socio o entrenador…"
          label="Buscar rutinas"
        />
        {staff && (
          <select
            className="form-select filter-select"
            aria-label="Filtrar rutinas por socio"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="all">Todos los socios</option>
            {data.users
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {fullName(item)}
                </option>
              ))}
          </select>
        )}
        <span className="result-count">{rows.length} rutinas</span>
      </div>
      {data.loading && !rows.length ? (
        <Loading />
      ) : rows.length ? (
        <div className="routine-grid">
          {rows.map((item, index) => (
            <article className="surface-card routine-card" key={item.id}>
              <div className="routine-card-top">
                <span className={`routine-icon routine-color-${index % 3}`}>
                  <Dumbbell size={26} />
                </span>
                <span className="subtle-pill">PERSONALIZADA</span>
                {staff && (
                  <button
                    className="icon-button"
                    aria-label={`Editar ${item.title}`}
                    onClick={() => setEditing(item)}
                  >
                    <Pencil size={17} />
                  </button>
                )}
              </div>
              <h2>{item.title}</h2>
              <p className="routine-excerpt">{item.description}</p>
              <div className="routine-owner">
                <Avatar
                  name={data.nameOf(item.userId)}
                  id={item.userId}
                  size="avatar-small"
                />
                <span>{data.nameOf(item.userId)}</span>
              </div>
              <div className="routine-trainer">
                <UserRound size={15} />
                <span>Entrenador: {item.trainerName}</span>
              </div>
              <div className="routine-card-footer">
                <button className="text-link" onClick={() => setViewing(item)}>
                  Ver entrenamiento
                  <ArrowUpRight size={17} />
                </button>
                {staff && (
                  <button
                    className="icon-button danger-button"
                    aria-label={`Eliminar ${item.title}`}
                    onClick={() => setRemoving(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="surface-card">
          <Empty
            title="El próximo entrenamiento empieza acá"
            description={
              staff
                ? "Creá una rutina a la medida de cada socio."
                : "Tu entrenador va a compartir tus rutinas en este espacio."
            }
          />
        </section>
      )}
      {editing && (
        <EntityForm
          title={edited ? "Editar rutina" : "Un entrenamiento a su medida"}
          description="Compartí una guía clara para acompañar cada entrenamiento."
          initial={{
            userId: edited?.userId.toString() || "",
            title: edited?.title || "",
            trainerName: edited?.trainerName || fullName(user || undefined),
            description: edited?.description || "",
          }}
          fields={[
            userField(data.users),
            {
              name: "title",
              label: "Nombre de la rutina",
              required: true,
              placeholder: "Ej. Fuerza · Cuerpo completo",
              maxLength: 200,
            },
            {
              name: "trainerName",
              label: "Entrenador a cargo",
              required: true,
              maxLength: 100,
            },
            {
              name: "description",
              label: "Detalle del entrenamiento",
              type: "textarea",
              required: true,
              wide: true,
              maxLength: 2000,
              placeholder: "Ejercicios, series, repeticiones e indicaciones…",
              help: "Hasta 2000 caracteres. Organizá las indicaciones en líneas para facilitar su lectura.",
            },
          ]}
          onClose={close}
          onSubmit={(values) =>
            commit(
              () =>
                save(
                  "/routines",
                  { ...values, userId: Number(values.userId) },
                  edited?.id,
                ),
              "La rutina está lista para entrenar.",
            )
          }
        />
      )}
      {viewing && (
        <Modal
          title={viewing.title}
          description={`Para ${data.nameOf(viewing.userId)} · Entrenador: ${viewing.trainerName}`}
          onClose={() => setViewing(null)}
          wide
        >
          <div className="dialog-body">
            <div className="routine-detail-banner">
              <Dumbbell size={25} />
              <span>TU GUÍA DE ENTRENAMIENTO</span>
            </div>
            <div className="routine-description">{viewing.description}</div>
          </div>
          <div className="dialog-footer">
            <button className="btn btn-light" onClick={() => setViewing(null)}>
              Cerrar
            </button>
            {staff && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
              >
                <Pencil size={16} />
                Editar rutina
              </button>
            )}
          </div>
        </Modal>
      )}
      {removing && (
        <Confirm
          title="Eliminar rutina"
          description={`La rutina “${removing.title}” dejará de estar disponible para ${data.nameOf(removing.userId)}.`}
          actionLabel="Eliminar rutina"
          onClose={() => setRemoving(null)}
          onConfirm={() =>
            commit(
              () => api(`/routines/${removing.id}`, { method: "DELETE" }),
              "La rutina se eliminó.",
            )
          }
        />
      )}
    </>
  );
}
