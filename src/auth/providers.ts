import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import { env } from "@/env/server";

import { findDevelopmentUser } from "./dev-users";

export function createAuthProviders() {
  const providers = [];

  if (
    env.NODE_ENV === "production" &&
    env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET
  ) {
    providers.push(
      GitHub({
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      }),
    );
  }

  if (env.NODE_ENV === "production") {
    return providers;
  }

  providers.push(
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
  );

  return providers;
}

export function isGitHubAuthConfigured() {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}
