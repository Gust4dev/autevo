import { redirect } from "next/navigation";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@autevo/database";

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      status: true,
      jobTitle: true,
    },
  });

  // Waiting for invite - redirect to awaiting page
  if (user?.status === "INVITED") redirect("/awaiting-invite");

  // User has tenant - they shouldn't be on welcome page
  if (user?.tenantId) {
    // Check if setup is complete (OWNER/ADMIN needs jobTitle)
    const needsSetup =
      (user.role === "OWNER" || user.role === "ADMIN_SAAS") && !user.jobTitle;

    if (needsSetup) {
      redirect("/setup");
    }

    // Ensure Clerk metadata is synced to prevent future loops
    const clerkUser = await currentUser();
    const metadata = clerkUser?.publicMetadata as
      | { needsOnboarding?: boolean }
      | undefined;

    if (metadata?.needsOnboarding === true) {
      // Update Clerk to remove needsOnboarding flag
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(userId, {
          publicMetadata: {
            ...clerkUser?.publicMetadata,
            needsOnboarding: false,
          },
        });
      } catch (error) {}
    }

    redirect("/dashboard");
  }

  return <>{children}</>;
}
