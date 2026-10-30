import {
  WorkspaceContext as Context,
  type Data,
  type Resource,
  type Workspace,
} from "./workspace-context";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api";
import { useAuth } from "./auth-context";
import { errorMessage, fullName } from "../lib";

const empty: Data = {
  users: [],
  memberships: [],
  payments: [],
  attendance: [],
  routines: [],
  notifications: [],
};
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<Data>(empty);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Workspace["errors"]>({});
  const controller = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    if (!user) return;
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setLoading(true);
    const admin = user.role === "ADMIN",
      staff = user.role !== "MEMBER";
    const paths: Record<Resource, string | null> = {
      users: staff ? "/users" : null,
      memberships: admin ? "/memberships" : `/memberships/user/${user.id}`,
      payments: admin ? "/payments" : `/payments/user/${user.id}`,
      attendance: staff ? "/attendance" : `/attendance/user/${user.id}`,
      routines: staff ? "/routines" : `/routines/user/${user.id}`,
      notifications: `/notifications/user/${user.id}`,
    };
    const entries = Object.entries(paths) as [Resource, string | null][];
    const results = await Promise.allSettled(
      entries.map(([, path]) =>
        path
          ? api<never[]>(path, { signal: active.signal })
          : Promise.resolve([user]),
      ),
    );
    if (active.signal.aborted) return;
    const failed: Workspace["errors"] = {};
    results.forEach((result, index) => {
      if (result.status === "rejected")
        failed[entries[index][0]] = errorMessage(result.reason);
    });
    setData((previous) => {
      const next = { ...previous };
      results.forEach((result, index) => {
        const resource = entries[index][0];
        if (result.status === "fulfilled")
          Object.assign(next, { [resource]: result.value });
      });
      return next;
    });
    setErrors(failed);
    setLoading(false);
  }, [user]);
  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);
  const userOf = (id: number) =>
    data.users.find((item) => item.id === id) ||
    (user?.id === id ? user : undefined);
  return (
    <Context.Provider
      value={{
        ...data,
        loading,
        errors,
        reload,
        userOf,
        nameOf: (id) => {
          const person = userOf(id);
          return person ? fullName(person) : `Socio #${id}`;
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
