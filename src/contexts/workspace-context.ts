import { createContext, useContext } from "react";
import type {
  Attendance,
  Membership,
  Notification,
  Payment,
  Routine,
  User,
} from "../types";
export interface Data {
  users: User[];
  memberships: Membership[];
  payments: Payment[];
  attendance: Attendance[];
  routines: Routine[];
  notifications: Notification[];
}
export type Resource = keyof Data;
export interface Workspace extends Data {
  loading: boolean;
  errors: Partial<Record<Resource, string>>;
  reload: () => Promise<void>;
  nameOf: (id: number) => string;
  userOf: (id: number) => User | undefined;
}
export const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WorkspaceProvider requerido");
  return workspace;
}
