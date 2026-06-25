"use server";

import { signOut } from "../../../auth";

export async function signOutFromShellAction() {
  await signOut({ redirectTo: "/login" });
}
