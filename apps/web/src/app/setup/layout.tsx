import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function SetupLayout({
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

  const { prisma } = await import("@filmtech/database");

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      jobTitle: true,
      status: true,
    },
  });

  // Link user by email if not found
  if (!user) {
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          tenantId: true,
          role: true,
          jobTitle: true,
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

  // Only first user can access setup directly
  if (!user) {
    const userCount = await prisma.user.count();
    if (userCount > 0) redirect("/welcome");
  }

  if (user?.tenantId) {
    const isOwnerOrAdmin = user.role === "OWNER" || user.role === "ADMIN_SAAS";
    if (!isOwnerOrAdmin) redirect("/dashboard");
    if (user.jobTitle) redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  );
}
