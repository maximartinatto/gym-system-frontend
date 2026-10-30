import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { Avatar } from "../components/ui";
import { fullName, roleLabel } from "../lib";
import type { Role } from "../types";

const navigation: {
  path: string;
  label: string;
  member?: string;
  icon: LucideIcon;
  roles?: Role[];
}[] = [
  { path: "/", label: "Resumen", icon: LayoutDashboard },
  {
    path: "/socios",
    label: "Socios",
    icon: UsersRound,
    roles: ["ADMIN", "TRAINER"],
  },
  {
    path: "/membresias",
    label: "Membresías",
    member: "Mi membresía",
    icon: BadgeCheck,
  },
  {
    path: "/pagos",
    label: "Pagos",
    member: "Mis pagos",
    icon: Wallet,
    roles: ["ADMIN", "MEMBER", "TRAINER"],
  },
  {
    path: "/asistencias",
    label: "Asistencias",
    member: "Mis asistencias",
    icon: Activity,
  },
  { path: "/rutinas", label: "Rutinas", member: "Mis rutinas", icon: Dumbbell },
  { path: "/notificaciones", label: "Notificaciones", icon: Bell },
];
export default function AppLayout() {
  const { user, logout } = useAuth(),
    { notifications, loading, reload, errors } = useWorkspace();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const navigationRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width:1099px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width:1099px)");
    const changed = () => {
      setCompact(media.matches);
      if (!media.matches) setOpen(false);
    };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    navigationRef.current?.querySelector<HTMLElement>("a")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const items = Array.from(
          navigationRef.current?.querySelectorAll<HTMLElement>("a,button") ||
            [],
        ).filter((item) => item.offsetParent !== null);
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [open]);
  if (!user) return null;
  const unread = notifications.filter((item) => !item.read).length;
  const current = navigation.find((item) => item.path === location.pathname);
  const label =
    user.role === "MEMBER" && current?.member
      ? current.member
      : current?.label || "Mi perfil";
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Ir al contenido
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        inert={compact && !open}
        aria-hidden={compact && !open}
        ref={navigationRef}
        className={`sidebar ${open ? "sidebar-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label="Menú principal"
        id="app-navigation"
      >
        <div className="brand">
          <span className="brand-mark">
            <Dumbbell size={25} strokeWidth={2.5} />
          </span>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            aria-label="GymSistem, inicio"
          >
            gym<span>sistem</span>
            <small>ESPACIO DE GESTIÓN</small>
          </Link>
          <button
            className="sidebar-close icon-button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X size={21} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-dot" />
          {user.role === "MEMBER" ? "Mi espacio" : roleLabel[user.role]}
          <ChevronDown size={14} aria-hidden="true" />
        </div>
        <p className="nav-section-title">PRINCIPAL</p>
        <nav onClick={() => setOpen(false)}>
          {navigation
            .filter((item) => !item.roles || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={19} />
                <span>
                  {user.role === "MEMBER" && item.member
                    ? item.member
                    : item.label}
                </span>
                {item.path === "/notificaciones" && unread > 0 && (
                  <span className="nav-count">{unread}</span>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="mini-orbit">
              <Dumbbell size={20} />
            </span>
            <strong>Todo listo para moverte.</strong>
            <p>
              Más tiempo para entrenar.
              <br />
              Todo lo demás, acá.
            </p>
            <Link to="/perfil" onClick={() => setOpen(false)}>
              Mi cuenta <ArrowUpRight size={15} />
            </Link>
          </div>
          <NavLink
            to="/perfil"
            onClick={() => setOpen(false)}
            className="sidebar-user"
          >
            <Avatar name={fullName(user)} id={user.id} />
            <span>
              <strong>{fullName(user)}</strong>
              <small>{roleLabel[user.role]}</small>
            </span>
          </NavLink>
          <button
            className="logout-button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
          <div className="sidebar-footer">
            GYMSISTEM <span>·</span> HECHO PARA TU GIMNASIO
          </div>
        </div>
      </aside>
      <div className="app-body" inert={open}>
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              aria-expanded={open}
              aria-controls="app-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={23} />
            </button>
            <span className="breadcrumb-root">Mi gimnasio</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{label}</strong>
          </div>
          <div className="topbar-end">
            {user.role !== "MEMBER" && (
              <form
                className="topbar-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate(`/socios?q=${encodeURIComponent(search)}`);
                  setSearch("");
                }}
              >
                <Search size={17} />
                <input
                  aria-label="Buscar un socio"
                  placeholder="Buscar un socio…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <kbd>↵</kbd>
              </form>
            )}
            <button
              className="icon-button"
              aria-label="Actualizar información"
              disabled={loading}
              onClick={() => void reload()}
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
            <Link
              className="icon-button notification-button"
              to="/notificaciones"
              aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
            >
              <Bell size={20} />
              {unread > 0 && <span className="notification-dot" />}
            </Link>
            <span className="topbar-divider" />
            <Link to="/perfil" aria-label="Ver mi perfil">
              <Avatar name={fullName(user)} id={user.id} size="avatar-small" />
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {Object.keys(errors).length > 0 && (
            <div className="service-alert" role="alert">
              Algunos datos no pudieron actualizarse. Conservamos la última
              información disponible.{" "}
              <button className="text-button" onClick={() => void reload()}>
                Reintentar
              </button>
            </div>
          )}
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            GymSistem <span className="muted">· Tu gimnasio, conectado.</span>
          </span>
          <span>
            <CalendarDays size={13} />
            {new Date().toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </footer>
      </div>
    </div>
  );
}
