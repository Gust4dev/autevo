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
  const { prisma } = await import("@autevo/database");

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      jobTitle: true,
      status: true,
      tenant: {
        select: { name: true, slug: true, status: true },
      },
    },
  });

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
          tenant: {
            select: { name: true, slug: true, status: true },
          },
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

  if (!user) {
    const userCount = await prisma.user.count();
    if (userCount > 0) redirect("/awaiting-invite");
  }

  if (user?.tenantId) {
    const isOwnerOrAdmin = user.role === "OWNER" || user.role === "ADMIN_SAAS";
    if (!isOwnerOrAdmin) redirect("/dashboard");

    const tenantName = user.tenant?.name || "";
    const isDefaultName = tenantName.startsWith("Estética de");
    const hasJobTitle = !!user.jobTitle;

    if (hasJobTitle && !isDefaultName) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">{children}</div>
    </div>
  );
}
