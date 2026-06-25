import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { normalizeRoles } from "@/auth/roles";
import { createAuthProviders } from "@/auth/providers";
import { resolveRolesForAuthenticatedUser } from "@/auth/user-role-sync";
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
    async jwt({ token, user }) {
      if (user) {
        const userId = user.id || token.sub;

        if (userId) {
          token.roles = await resolveRolesForAuthenticatedUser({
            userId,
            email: user.email,
            sessionRoles: user.roles,
          });
        }
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
