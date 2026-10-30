import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/Auth";
import { useAuth } from "./contexts/auth-context";
import { WorkspaceProvider } from "./contexts/Workspace";
import { Loading, ToastProvider } from "./components/ui";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Memberships from "./pages/Memberships";
import Payments from "./pages/Payments";
import Attendance from "./pages/Attendance";
import Routines from "./pages/Routines";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

function Protected() {
  const { user, restoring, restoreError, retryRestore, logout } = useAuth(),
    location = useLocation();
  if (restoring)
    return (
      <div className="full-page-loading">
        <Loading label="Recuperando tu sesión…" />
      </div>
    );
  if (restoreError)
    return (
      <div className="reconnect-page">
        <h1>No pudimos recuperar tu sesión</h1>
        <p>Verificá la conexión con el gimnasio e intentá nuevamente.</p>
        <button className="btn btn-primary" onClick={retryRestore}>
          Reintentar
        </button>
        <button className="btn btn-light" onClick={logout}>
          Volver al ingreso
        </button>
      </div>
    );
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
function StaffOnly() {
  const { user } = useAuth();
  return user?.role === "MEMBER" ? <Navigate to="/" replace /> : <Users />;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected />}>
              <Route
                element={
                  <WorkspaceProvider>
                    <AppLayout />
                  </WorkspaceProvider>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="socios" element={<StaffOnly />} />
                <Route path="membresias" element={<Memberships />} />
                <Route path="pagos" element={<Payments />} />
                <Route path="asistencias" element={<Attendance />} />
                <Route path="rutinas" element={<Routines />} />
                <Route path="notificaciones" element={<Notifications />} />
                <Route path="perfil" element={<Profile />} />
                <Route
                  path="*"
                  element={
                    <div className="not-found">
                      <h1>Este espacio no existe</h1>
                      <p>Volvé al resumen para continuar.</p>
                      <Link to="/" className="btn btn-primary">
                        Ir al resumen
                      </Link>
                    </div>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
