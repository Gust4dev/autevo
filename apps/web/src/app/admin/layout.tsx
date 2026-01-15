import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@autevo/database";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Verify user is ADMIN_SAAS
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, name: true },
  });

  if (!user || user.role !== "ADMIN_SAAS") {
    redirect("/dashboard");
  }

  return <AdminLayoutClient userName={user.name}>{children}</AdminLayoutClient>;
}
