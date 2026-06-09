"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  login,
  requireSession,
  setSessionCookie,
  switchOrganization,
} from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const session = await login(email, password);
  if (!session) {
    redirect("/login?error=1");
  }

  await setSessionCookie(session);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function switchOrganizationAction(formData: FormData) {
  await requireSession();
  const organizationId = String(formData.get("organizationId") ?? "");
  const updated = await switchOrganization(organizationId);
  if (!updated) redirect("/dashboard?error=forbidden");
  revalidatePath("/", "layout");
}
