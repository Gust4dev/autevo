import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { DashboardShell } from "@/components/layout";
import { prisma } from "@autevo/database";

interface ClerkPublicMetadata {
  tenantId?: string;
  role?: string;
  tenantStatus?: string;
  dbUserId?: string;
}

const getTenantSettings = unstable_cache(
  async (tenantId: string) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        primaryColor: true,
        secondaryColor: true,
        logo: true,
        name: true,
      },
    });
    return tenant;
  },
  ["tenant-settings"],
  { revalidate: 300, tags: ["tenant-settings"] },
);

const getQuickStats = unstable_cache(
  async (tenantId: string, userId?: string, role?: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const baseWhere: Record<string, unknown> = { tenantId };
    if (role === "MEMBER" && userId) {
      baseWhere.assignedToId = userId;
    }

    const [todayOrders, inProgress, pendingPayments] = await Promise.all([
      prisma.serviceOrder.count({
        where: { ...baseWhere, scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.serviceOrder.count({
        where: { ...baseWhere, status: { in: ["EM_VISTORIA", "EM_EXECUCAO"] } },
      }),
      prisma.serviceOrder.count({
        where: { ...baseWhere, status: "AGUARDANDO_PAGAMENTO" },
      }),
    ]);

    return { todayOrders, inProgress, pendingPayments };
  },
  ["quick-stats"],
  { revalidate: 60, tags: ["quick-stats"] },
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const metadata = sessionClaims?.public_metadata as
    | ClerkPublicMetadata
    | undefined;
  const tenantId = metadata?.tenantId;
  const role = metadata?.role;
  const tenantStatus = metadata?.tenantStatus;
  const dbUserId = metadata?.dbUserId;

  if (role !== "ADMIN_SAAS") {
    if (tenantStatus === "PENDING_ACTIVATION") {
      redirect("/activate");
    }
    if (tenantStatus === "SUSPENDED") {
      redirect("/suspended");
    }
  }

  const [initialSettings, prefetchedStats] = await Promise.all([
    tenantId ? getTenantSettings(tenantId) : null,
    tenantId ? getQuickStats(tenantId, dbUserId, role) : null,
  ]);

  return (
    <DashboardShell
      userRole={role}
      initialSettings={initialSettings}
      prefetchedStats={prefetchedStats}
    >
      {children}
    </DashboardShell>
  );
}
