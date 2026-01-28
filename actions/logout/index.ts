"use server";

import { signOut } from "@/auth";
import { DEFAULT_AUTH_REDIRECT } from "@/routes";

export async function logout() {
  await signOut({ redirectTo: DEFAULT_AUTH_REDIRECT });
}
