import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@filmtech/database";
import { DashboardShell } from "@/components/layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const metadata = clerkUser?.publicMetadata as
    | { needsOnboarding?: boolean }
    | undefined;

  if (metadata?.needsOnboarding) redirect("/welcome");

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      role: true,
      jobTitle: true,
      tenantId: true,
      clerkId: true,
      status: true,
    },
  });

  // Link user by email if not found by clerkId
  if (!user) {
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
          status: true,
        },
      });

      if (existingByEmail) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { clerkId: userId, status: "ACTIVE" },
        });
        user = existingByEmail;
      }
    }
  }

  if (user?.status === "INVITED") redirect("/awaiting-invite");

  if (!user) {
    const userCount = await prisma.user.count();
    redirect(userCount === 0 ? "/setup" : "/welcome");
  }

  if (!user.tenantId) redirect("/welcome");

  if ((user.role === "ADMIN_SAAS" || user.role === "OWNER") && !user.jobTitle) {
    redirect("/setup");
  }

  return <DashboardShell userRole={user?.role}>{children}</DashboardShell>;
}
