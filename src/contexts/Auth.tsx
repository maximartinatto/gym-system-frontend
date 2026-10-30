import { AuthContext as Context } from "./auth-context";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError, setApiToken } from "../api";
import { tokenExpiry } from "../lib";
import type { Session, User } from "../types";

const key = "gymsistem.session";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const value = JSON.parse(
        sessionStorage.getItem(key) || "null",
      ) as Session | null;
      if (value?.token && tokenExpiry(value.token) > Date.now()) {
        setApiToken(value.token);
        return value;
      }
    } catch {
      /* Invalid persisted session is discarded. */
    }
    sessionStorage.removeItem(key);
    return null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(!!session);
  const [restoreError, setRestoreError] = useState(false);
  const [expired, setExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const logout = useCallback(() => {
    sessionStorage.removeItem(key);
    setApiToken(null);
    setSession(null);
    setUser(null);
    setRestoring(false);
    setRestoreError(false);
  }, []);
  useEffect(() => {
    if (!session || user) return;
    const controller = new AbortController();
    setRestoring(true);
    setRestoreError(false);
    api<User>("/users/me", { signal: controller.signal })
      .then((profile) => {
        setUser(profile);
        setSession((current) =>
          current ? { ...current, role: profile.role } : null,
        );
        setRestoring(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) logout();
        else {
          setRestoreError(true);
          setRestoring(false);
        }
      });
    return () => controller.abort();
  }, [session, user, attempt, logout]);
  useEffect(() => {
    const expire = () => {
      logout();
      setExpired(true);
    };
    window.addEventListener("gym:unauthorized", expire);
    const timer = session
      ? window.setTimeout(
          expire,
          Math.max(0, tokenExpiry(session.token) - Date.now()),
        )
      : undefined;
    return () => {
      window.removeEventListener("gym:unauthorized", expire);
      clearTimeout(timer);
    };
  }, [session, logout]);
  const login = async (email: string, password: string) => {
    const result = await api<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    setApiToken(result.token);
    try {
      const profile = await api<User>("/users/me");
      sessionStorage.setItem(key, JSON.stringify(result));
      setUser(profile);
      setSession({ ...result, role: profile.role });
      setExpired(false);
      setRestoreError(false);
    } catch (error) {
      setApiToken(null);
      throw error;
    }
  };
  return (
    <Context.Provider
      value={{
        session,
        user,
        restoring,
        restoreError,
        expired,
        login,
        logout,
        retryRestore: () => setAttempt((a) => a + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
