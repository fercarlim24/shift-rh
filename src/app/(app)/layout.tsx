import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getAccessibleOrganizations } from "@/lib/tenant";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const organizations = await getAccessibleOrganizations(session);

  const activeOrganization =
    organizations.find((org) => org.id === session.activeOrganizationId) ??
    organizations[0];

  if (!activeOrganization) {
    redirect("/login");
  }

  return (
    <AppShell
      session={session}
      organizations={organizations}
      activeOrganization={activeOrganization}
    >
      {children}
    </AppShell>
  );
}
