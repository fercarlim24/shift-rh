import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const organizations = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, tradeName: true },
  });

  const activeOrganization = organizations.find(
    (org) => org.id === session.activeOrganizationId,
  );

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
