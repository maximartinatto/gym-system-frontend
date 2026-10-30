import { createContext, useContext } from "react";
import type { Session, User } from "../types";
interface AuthState {
  session: Session | null;
  user: User | null;
  restoring: boolean;
  restoreError: boolean;
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  retryRestore: () => void;
}
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider requerido");
  return auth;
}
