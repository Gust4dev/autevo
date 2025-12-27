import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { prisma } = await import("@filmtech/database");

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      jobTitle: true,
    },
  });

  // SELF-HEALING: Check for invite by email if not found by clerkId
  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          tenantId: true,
          role: true,
          jobTitle: true,
        },
      });

      if (existingByEmail) {
        // Link it
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { clerkId: userId, status: "ACTIVE" },
        });
        user = existingByEmail;
      }
    }
  }

  // Check if user is already "linked" / setup
  // Case A: User has a tenantId (Linked)
  // Sub-case A1: User is NOT Owner/Admin (Member/Manager) -> Should never be in setup -> Dashboard
  // Sub-case A2: User IS Owner/Admin BUT has JobTitle (Setup Complete) -> Dashboard
  // Sub-case A3: User IS Owner/Admin AND missing JobTitle -> Stay in Setup (Completion Phase)
  if (user?.tenantId) {
    const isOwnerOrAdmin = user.role === "OWNER" || user.role === "ADMIN_SAAS";

    // If not owner/admin, they are just employees, so they go to dashboard
    if (!isOwnerOrAdmin) {
      redirect("/dashboard");
    }

    // If owner but already has profile setup (JobTitle), they are done
    if (user.jobTitle) {
      redirect("/dashboard");
    }

    // Fallthrough: Owner with missing JobTitle stays to finish setup
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  );
}
