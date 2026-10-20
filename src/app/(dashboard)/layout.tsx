import { redirect } from "next/navigation";
import { auth } from "@/core/auth/auth";
import { isActiveSessionUser } from "@/core/auth/repository";
import { getModuleNav } from "@/core/module-registry/registry";
import { AppShell } from "@/core/layout/AppShell";
import "@/config/modules";

/** Protects tenant pages and supplies permission-filtered navigation. */
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  if (!(await isActiveSessionUser(session.user.id, session.user.tenantId))) redirect("/login");

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "Dashboard", order: 1, area: "tenant" as const },
    ...getModuleNav({ area: "tenant", permissions: session.user.permissions }),
  ];

  return <AppShell title="CRM" navItems={navItems} userName={session.user.name} userEmail={session.user.email}>{children}</AppShell>;
}
