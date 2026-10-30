import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Dumbbell,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { ErrorNotice } from "../components/ui";
import { errorMessage } from "../lib";

export default function Login() {
  const { login, user, expired } = useAuth(),
    location = useLocation();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (user)
    return (
      <Navigate
        to={(location.state as { from?: string } | null)?.from || "/"}
        replace
      />
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="brand-mark">
            <Dumbbell size={27} />
          </span>
          gym<span>sistem</span>
        </div>
        <div className="login-copy">
          <span className="login-kicker">
            <span />
            UN ESPACIO. TODO TU GIMNASIO.
          </span>
          <h1>
            Personas en
            <br />
            movimiento.
            <br />
            <em>Todo conectado.</em>
          </h1>
          <p>
            Una forma más simple de acompañar cada entrenamiento y gestionar tu
            gimnasio.
          </p>
          <div className="login-features">
            <span>
              <UsersRound size={19} />
              Tu comunidad, más cerca
            </span>
            <span>
              <BadgeCheck size={19} />
              Cada membresía, en orden
            </span>
            <span>
              <Dumbbell size={19} />
              Entrenamientos con propósito
            </span>
          </div>
        </div>
        <div className="login-orbits" aria-hidden="true">
          <div />
          <div />
          <span>
            <Dumbbell size={60} strokeWidth={1.3} />
          </span>
        </div>
        <footer>MENOS GESTIÓN. MÁS MOVIMIENTO.</footer>
      </section>
      <main className="login-main">
        <div className="login-mobile-brand">
          <Dumbbell /> GymSistem
        </div>
        <div className="login-form-wrap">
          <p className="eyebrow">BIENVENIDO A TU ESPACIO</p>
          <h2>Qué bueno verte.</h2>
          <p className="login-subtitle">Ingresá a tu cuenta para continuar.</p>
          {expired && (
            <div className="info-notice" role="status">
              Tu sesión terminó. Ingresá nuevamente para continuar.
            </div>
          )}
          <ErrorNotice message={error} />
          <form onSubmit={submit}>
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="nombre@correo.com"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
            <label className="form-label mt-4" htmlFor="login-password">
              Contraseña
            </label>
            <div className="password-input">
              <input
                id="login-password"
                type={visible ? "text" : "password"}
                className="form-control"
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button className="btn btn-primary login-submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={19} className="spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  Ingresar a mi cuenta
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>
          <p className="login-help">
            ¿Necesitás una cuenta o recuperar tu acceso?
            <br />
            <strong>Contactá a la administración de tu gimnasio.</strong>
          </p>
          <div className="login-security">
            <ShieldCheck size={17} />
            <span>Tu información, en un espacio seguro.</span>
          </div>
        </div>
        <footer>
          Administración <span>·</span> Entrenadores <span>·</span> Socios
        </footer>
      </main>
    </div>
  );
}
