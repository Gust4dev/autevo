import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@filmtech/database";
import { DashboardShell } from "@/components/layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user needs to complete setup
  // Check if user needs to complete setup
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      jobTitle: true,
      tenantId: true,
      clerkId: true,
    },
  });

  // SELF-HEALING: If user not found by Clerk ID, check by Email (Webhook Lag)
  // This happens when an INVITED user signs up but the webhook hasn't processed yet.
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          role: true,
          jobTitle: true,
          tenantId: true,
          clerkId: true,
        },
      });

      if (existingByEmail) {
        // Found the invite! Link it immediately to avoid race condition.
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { clerkId: userId, status: "ACTIVE" },
        });
        user = existingByEmail;
      }
    }
  }

  // If user is Owner/Admin and has no Job Title (setup not completed), redirect to setup
  // We check for no jobTitle because it's a required field in the setup wizard
  // New users created via email/password will have null jobTitle initially
  // If user doesn't exist in DB (sync issue) or has no tenant (setup incomplete)
  // we redirect to setup. This covers:
  // 1. New signups (no role, no tenant)
  // 2. Owners who haven't finished setup
  // 3. Invited users who haven't accepted (should be handled by invite flow, but safety net)
  if (!user || !user.tenantId) {
    redirect("/setup");
  }

  // Also stick to the specific jobTitle check if they have a tenant but incomplete profile
  if ((user.role === "ADMIN_SAAS" || user.role === "OWNER") && !user.jobTitle) {
    redirect("/setup");
  }

  return <DashboardShell userRole={user?.role}>{children}</DashboardShell>;
}
