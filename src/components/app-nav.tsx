"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ChartPieSlice,
  GitBranch,
  IdentificationCard,
  Kanban,
  ListChecks,
  SquaresFour,
  UserCircle,
  Users,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

const iconMap: Record<string, Icon> = {
  "/dashboard": ChartPieSlice,
  "/clientes": SquaresFour,
  "/vagas": Briefcase,
  "/candidatos": Users,
  "/recrutamento": Kanban,
  "/tarefas": ListChecks,
  "/admissoes": IdentificationCard,
  "/colaboradores": UsersThree,
  "/configuracoes/pipeline": GitBranch,
  "/usuarios": UserCircle,
};

export function AppNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const IconComponent = iconMap[item.href] ?? SquaresFour;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`ui-nav-item group flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium ${
              active ? "ui-nav-active" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
            }`}
          >
            <IconComponent
              className={`h-[18px] w-[18px] shrink-0 transition-[color] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
                active ? "text-[var(--accent)]" : "text-zinc-600 group-hover:text-zinc-300"
              }`}
              weight={active ? "fill" : "regular"}
            />
            <span className={active ? "text-white" : undefined}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
