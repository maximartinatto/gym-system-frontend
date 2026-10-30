import type { User } from "../types";
import type { Field } from "./ui";
import { fullName } from "../lib";
export const userField = (users: User[]): Field => ({
  name: "userId",
  label: "Socio",
  type: "select",
  required: true,
  wide: true,
  options: users
    .filter((user) => user.active)
    .map((user) => ({
      value: user.id,
      label: `${fullName(user)} · ${user.email}`,
    })),
});
