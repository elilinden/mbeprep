import type { DefaultSession } from "next-auth";

import type { AppRole } from "@/auth/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: AppRole[];
    };
  }

  interface User {
    roles?: AppRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: AppRole[];
  }
}
