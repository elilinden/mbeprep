import Credentials from "next-auth/providers/credentials";

import { env } from "@/env/server";

import { findDevelopmentUser } from "./dev-users";

export function createAuthProviders() {
  if (env.NODE_ENV === "production") {
    return [];
  }

  return [
    Credentials({
      id: "dev-login",
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (env.NODE_ENV === "production") {
          return null;
        }

        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const user = findDevelopmentUser(email);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        };
      },
    }),
  ];
}
