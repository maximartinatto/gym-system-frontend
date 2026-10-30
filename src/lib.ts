import type { Role, User } from "./types";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Administración",
  TRAINER: "Entrenador",
  MEMBER: "Socio",
};
export const fullName = (user?: Pick<User, "firstName" | "lastName">) =>
  user ? `${user.firstName} ${user.lastName}`.trim() : "Socio";
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
export const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
export const dateAfter = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function dateLabel(value?: string | null, withTime = false) {
  if (!value) return "—";
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(parsed);
}
export const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
export function duration(start: string, end: string | null) {
  if (!end) return "En el gimnasio";
  const minutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
  );
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
    : `${minutes} min`;
}
export function tokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    return (
      JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).exp *
        1000 || 0
    );
  } catch {
    return 0;
  }
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "No pudimos completar la operación. Intentá nuevamente.";
export const contains = (
  query: string,
  ...values: (string | number | undefined | null)[]
) =>
  values
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes(
      query
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    );
