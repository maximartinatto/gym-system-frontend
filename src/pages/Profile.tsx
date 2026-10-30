import { BadgeCheck, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { Avatar, Badge, PageHeading } from "../components/ui";
import { fullName, roleLabel } from "../lib";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeading
        title="Mi perfil"
        description="Tu información personal y tu acceso al gimnasio."
      />
      <div className="profile-grid">
        <section className="surface-card profile-summary">
          <Avatar name={fullName(user)} id={user.id} size="avatar-large" />
          <h2>{fullName(user)}</h2>
          <p>{user.email}</p>
          <Badge value={user.role} />
          <div className="profile-member-code">
            CUENTA #{String(user.id).padStart(4, "0")}
          </div>
          <div className="profile-active">
            <span />
            Cuenta activa
          </div>
        </section>
        <section className="surface-card">
          <div className="section-heading">
            <div>
              <h2>Información personal</h2>
              <p>Los datos de tu cuenta en GymSistem</p>
            </div>
            <UserRound size={22} className="muted" />
          </div>
          <dl className="profile-details">
            <div>
              <dt>
                <UserRound size={17} />
                Nombre y apellido
              </dt>
              <dd>{fullName(user)}</dd>
            </div>
            <div>
              <dt>
                <Mail size={17} />
                Email
              </dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>
                <Phone size={17} />
                Teléfono
              </dt>
              <dd>{user.phone || "Sin teléfono registrado"}</dd>
            </div>
            <div>
              <dt>
                <BadgeCheck size={17} />
                Edad
              </dt>
              <dd>{user.age ? `${user.age} años` : "Sin edad registrada"}</dd>
            </div>
            <div>
              <dt>
                <ShieldCheck size={17} />
                Perfil de acceso
              </dt>
              <dd>{roleLabel[user.role]}</dd>
            </div>
          </dl>
          <div className="profile-help">
            <ShieldCheck size={20} />
            <p>
              Para actualizar tus datos o tu contraseña, contactá a la
              administración del gimnasio.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
