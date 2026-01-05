import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@filmtech/database";

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, tenantId: true, role: true, status: true },
  });

  // Already onboarded - redirect to dashboard
  if (user?.tenantId && user.status !== "INVITED") redirect("/dashboard");

  // Waiting for invite - redirect to awaiting page
  if (user?.status === "INVITED") redirect("/awaiting-invite");

  return <>{children}</>;
}
