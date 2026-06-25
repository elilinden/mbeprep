import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { findDevelopmentUser } from "@/auth/dev-users";
import { normalizeRoles } from "@/auth/roles";
import { createAuthProviders } from "@/auth/providers";
import { env } from "@/env/server";
import { prisma } from "@/lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: createAuthProviders(),
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: env.AUTH_SECRET,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const developmentUser =
          user.email && env.NODE_ENV !== "production"
            ? findDevelopmentUser(user.email)
            : null;
        token.roles = normalizeRoles(user.roles ?? developmentUser?.roles);
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.roles = normalizeRoles(token.roles);
      return session;
    },
  },
});
