import { DEVELOPMENT_USERS } from "@/domain/seed-data";

import type { AppRole } from "./roles";

export type DevelopmentUser = {
  id: string;
  email: string;
  name: string;
  roles: AppRole[];
};

export const developmentUsers: DevelopmentUser[] = [
  {
    id: "dev-admin",
    email: DEVELOPMENT_USERS.admin.email,
    name: DEVELOPMENT_USERS.admin.displayName,
    roles: ["ADMIN"],
  },
  {
    id: "dev-learner",
    email: DEVELOPMENT_USERS.learner.email,
    name: DEVELOPMENT_USERS.learner.displayName,
    roles: ["STUDENT"],
  },
];

export function findDevelopmentUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    developmentUsers.find((user) => user.email === normalizedEmail) ?? null
  );
}
