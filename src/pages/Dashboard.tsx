import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Dumbbell,
  LogIn,
  Plus,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { useWorkspace } from "../contexts/workspace-context";
import { Avatar, Badge, Empty, Loading, PageHeading } from "../components/ui";
import { dateAfter, dateLabel, money, timeLabel, today } from "../lib";

function Stat({
  label,
  value,
  detail,
  icon: Icon,
  accent = "",
  link,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  accent?: string;
  link: string;
}) {
  return (
    <Link to={link} className={`stat-card ${accent}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong
        className={`stat-number ${typeof value === "string" && value.length > 10 ? "stat-number-long" : ""}`}
      >
        {value}
      </strong>
      <div className="stat-bottom">
        <span>{detail}</span>
        <ArrowUpRight size={17} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth(),
    data = useWorkspace();
  if (!user) return null;
  const admin = user.role === "ADMIN",
    member = user.role === "MEMBER";
  const present = data.attendance.filter(
    (item) => !item.checkOut && item.active,
  );
  const currentMonth = today().slice(0, 7),
    monthlyPayments = data.payments.filter((item) =>
      item.paymentDate.startsWith(currentMonth),
    );
  const activeMemberships = data.memberships.filter(
    (item) => item.status === "ACTIVE",
  );
  const membership = activeMemberships.find((item) => item.userId === user.id);
  const expiring = data.memberships.filter(
    (item) => item.status === "ACTIVE" && item.endDate <= dateAfter(7),
  );
  const recent = [...data.attendance]
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .slice(0, 5);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = dateAfter(i - 6);
    return {
      date,
      label: new Date(`${date}T12:00:00`)
        .toLocaleDateString("es-AR", { weekday: "short" })
        .replace(".", ""),
      count: data.attendance.filter((item) => item.checkIn.startsWith(date))
        .length,
    };
  });
  const maxCount = Math.max(1, ...days.map((item) => item.count)),
    weekTotal = days.reduce((sum, day) => sum + day.count, 0);
  return (
    <>
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
          .toUpperCase()}
        title={`Hola, ${user.firstName} 👋`}
        description={
          member
            ? "Tu progreso empieza con cada visita. Este es tu espacio."
            : "Todo lo que pasa en tu gimnasio, de un vistazo."
        }
      >
        <Link
          to={member ? "/asistencias" : admin ? "/socios?nuevo=1" : "/socios"}
          className="btn btn-primary"
        >
          {member ? <LogIn size={18} /> : <Plus size={18} />}
          {member
            ? "Registrar mi ingreso"
            : admin
              ? "Nuevo socio"
              : "Ver socios"}
        </Link>
      </PageHeading>
      <section className="overview-hero">
        <div>
          <span className="hero-pill">
            <span />
            {member ? "TU ESPACIO PERSONAL" : "BIENVENIDO A GYMSISTEM"}
          </span>
          <h2>
            {member
              ? "Un día más cerca de tu objetivo."
              : "Un gimnasio en movimiento.\nUna gestión más simple."}
          </h2>
          <p>
            {member
              ? "Consultá tus rutinas, seguí tus visitas y encontrá todo lo que necesitás para entrenar."
              : "Socios, entrenamientos y cada detalle del día. Todo en un mismo lugar."}
          </p>
          <Link to={member ? "/rutinas" : "/asistencias"}>
            {member ? "Ver mis entrenamientos" : "Gestionar asistencias"}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="hero-ring ring-one" />
          <div className="hero-ring ring-two" />
          <div className="hero-dumbbell">
            <Dumbbell size={96} strokeWidth={1.3} />
          </div>
          <span className="floating-pill">
            <Activity size={17} /> Cada visita cuenta
          </span>
          <span className="floating-dot" />
        </div>
      </section>
      {data.loading && !data.attendance.length ? (
        <Loading label="Preparando tu resumen…" />
      ) : (
        <div className="stats-grid">
          {member ? (
            <>
              <Stat
                label="Mi membresía"
                value={membership ? "Activa" : "Sin plan activo"}
                detail={
                  membership
                    ? `Hasta el ${dateLabel(membership.endDate)}`
                    : "Consultá tus membresías"
                }
                icon={BadgeCheck}
                accent="stat-featured"
                link="/membresias"
              />
              <Stat
                label="Mis visitas"
                value={data.attendance.length}
                detail="Asistencias registradas"
                icon={Activity}
                link="/asistencias"
              />
              <Stat
                label="Mis rutinas"
                value={data.routines.length}
                detail="Listas para entrenar"
                icon={Dumbbell}
                link="/rutinas"
              />
              <Stat
                label="Pagos de este mes"
                value={money(
                  monthlyPayments.reduce((sum, item) => sum + item.amount, 0),
                )}
                detail="Importes registrados en ARS"
                icon={Wallet}
                link="/pagos"
              />
            </>
          ) : (
            <>
              <Stat
                label="Socios activos"
                value={
                  data.users.filter(
                    (item) => item.active && item.role === "MEMBER",
                  ).length
                }
                detail="Tu comunidad de entrenamiento"
                icon={UsersRound}
                accent="stat-featured"
                link="/socios"
              />
              <Stat
                label={admin ? "Membresías vigentes" : "Rutinas activas"}
                value={admin ? activeMemberships.length : data.routines.length}
                detail={
                  admin
                    ? `${expiring.length} vencen en los próximos 7 días`
                    : "Entrenamientos personalizados"
                }
                icon={admin ? BadgeCheck : Dumbbell}
                link={admin ? "/membresias" : "/rutinas"}
              />
              <Stat
                label="Entrenando ahora"
                value={present.length}
                detail="Ingresos sin salida registrada"
                icon={Activity}
                link="/asistencias"
              />
              <Stat
                label={admin ? "Ingresos del mes" : "Visitas de hoy"}
                value={
                  admin
                    ? money(
                        monthlyPayments.reduce(
                          (sum, item) => sum + item.amount,
                          0,
                        ),
                      )
                    : data.attendance.filter((item) =>
                        item.checkIn.startsWith(today()),
                      ).length
                }
                detail={
                  admin ? "Pagos registrados · ARS" : "Asistencias registradas"
                }
                icon={admin ? Wallet : CalendarDays}
                link={admin ? "/pagos" : "/asistencias"}
              />
            </>
          )}
        </div>
      )}
      <div className="dashboard-grid">
        <section className="surface-card attendance-chart">
          <div className="section-heading">
            <div>
              <h2>{member ? "Tu constancia" : "Movimiento de la semana"}</h2>
              <p>Asistencias de los últimos 7 días</p>
            </div>
            <span className="subtle-pill">
              <CalendarDays size={14} />
              Últimos 7 días
            </span>
          </div>
          <div className="chart-summary">
            <strong>{weekTotal}</strong>
            <span>
              {weekTotal === 1 ? "visita registrada" : "visitas registradas"}
            </span>
            <span className="chart-legend">
              <i />
              Asistencias
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={days
              .map((day) => `${day.label}: ${day.count} visitas`)
              .join(", ")}
          >
            <div className="chart-grid-lines">
              <span>{maxCount}</span>
              <span>{Math.round(maxCount / 2)}</span>
              <span>0</span>
            </div>
            <div className="bars">
              {days.map((day, index) => (
                <div className="bar-column" key={day.date}>
                  <div className="bar-track">
                    <div
                      className={`chart-bar ${index === 6 ? "bar-today" : ""}`}
                      style={{ height: `${(day.count / maxCount) * 100}%` }}
                    >
                      <span>{day.count}</span>
                    </div>
                  </div>
                  <span className={index === 6 ? "today-label" : ""}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {!weekTotal && (
            <p className="chart-empty-caption">
              Las próximas visitas van a dar forma a este gráfico.
            </p>
          )}
        </section>
        <section className="surface-card quick-actions">
          <div className="section-heading">
            <div>
              <h2>Todo a mano</h2>
              <p>Tu próximo paso, más cerca</p>
            </div>
            <ArrowUpRight size={20} className="muted" />
          </div>
          {(member
            ? [
                {
                  to: "/rutinas",
                  label: "Mis entrenamientos",
                  detail: "Tu rutina, siempre a mano",
                  icon: Dumbbell,
                },
                {
                  to: "/membresias",
                  label: "Mi membresía",
                  detail: "Vigencia y detalle de tu plan",
                  icon: BadgeCheck,
                },
                {
                  to: "/notificaciones",
                  label: "Mis novedades",
                  detail: "Avisos de tu gimnasio",
                  icon: Activity,
                },
              ]
            : [
                {
                  to: admin ? "/socios?nuevo=1" : "/socios",
                  label: admin ? "Sumar un socio" : "Consultar socios",
                  detail: "Tu comunidad sigue creciendo",
                  icon: UsersRound,
                },
                {
                  to: "/asistencias",
                  label: "Registrar un ingreso",
                  detail: "Acompañá cada visita",
                  icon: LogIn,
                },
                {
                  to: "/rutinas?nueva=1",
                  label: "Crear una rutina",
                  detail: "Un entrenamiento a su medida",
                  icon: Dumbbell,
                },
              ]
          ).map((action) => (
            <Link className="quick-action" to={action.to} key={action.to}>
              <span className="quick-icon">
                <action.icon size={21} />
              </span>
              <span>
                <strong>{action.label}</strong>
                <small>{action.detail}</small>
              </span>
              <ChevronArrow />
            </Link>
          ))}
        </section>
      </div>
      <div className="dashboard-bottom-grid">
        <section className="surface-card">
          <div className="section-heading">
            <div>
              <h2>{member ? "Tus últimas visitas" : "Últimos movimientos"}</h2>
              <p>
                {member
                  ? "Cada entrenamiento suma."
                  : "Las visitas más recientes a tu gimnasio"}
              </p>
            </div>
            <Link to="/asistencias" className="text-link">
              Ver todas
              <ArrowRight size={15} />
            </Link>
          </div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((item) => (
                <div className="recent-item" key={item.id}>
                  <Avatar name={data.nameOf(item.userId)} id={item.userId} />
                  <div className="recent-person">
                    <strong>{data.nameOf(item.userId)}</strong>
                    <span>
                      {dateLabel(item.checkIn)} · {timeLabel(item.checkIn)}
                    </span>
                  </div>
                  <Badge
                    value={item.checkOut ? "Finalizada" : "Entrenando"}
                    tone={item.checkOut ? "neutral" : "success"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="El próximo movimiento empieza acá"
              description="Los ingresos registrados aparecerán en este espacio."
            />
          )}
        </section>
        <section className="surface-card next-steps">
          <div className="section-heading">
            <div>
              <h2>
                {admin ? "Para tener en cuenta" : "Tu gimnasio, más cerca"}
              </h2>
              <p>
                {admin
                  ? "Membresías próximas a vencer"
                  : "Información de tu espacio"}
              </p>
            </div>
            <Clock3 size={19} className="muted" />
          </div>
          {admin ? (
            expiring.length ? (
              <div className="expiry-list">
                {expiring.slice(0, 4).map((item) => (
                  <Link to="/membresias" key={item.id}>
                    <span>
                      <strong>{data.nameOf(item.userId)}</strong>
                      <small>{item.planName}</small>
                    </span>
                    <Badge value={dateLabel(item.endDate)} tone="warning" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="calm-state">
                <span>
                  <BadgeCheck size={31} />
                </span>
                <h3>Todo al día</h3>
                <p>No hay membresías que venzan en los próximos 7 días.</p>
              </div>
            )
          ) : (
            <div className="personal-reminder">
              <BadgeCheck size={31} />
              <h3>
                {member && membership
                  ? membership.planName
                  : "Cada detalle, en tu espacio"}
              </h3>
              <p>
                {member && membership
                  ? `Tu membresía está vigente hasta el ${dateLabel(membership.endDate)}.`
                  : "Consultá tus notificaciones para estar al día con las novedades del gimnasio."}
              </p>
              <Link
                to={member ? "/membresias" : "/notificaciones"}
                className="text-link"
              >
                Ver detalles
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function ChevronArrow() {
  return <ArrowRight size={17} className="quick-arrow" />;
}
