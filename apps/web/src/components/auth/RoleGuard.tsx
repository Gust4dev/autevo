'use client';

import { useUser } from '@clerk/nextjs';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowed: ('OWNER' | 'MANAGER' | 'MEMBER')[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowed, fallback = null }: RoleGuardProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null; // Or a loading skeleton if preferred, but usually we want to avoid flicker
  }

  const userRole = user?.publicMetadata?.role as string | undefined;

  // If user has no role or role is not in allowed list, return fallback
  if (!userRole || !allowed.includes(userRole as any)) {
    return <>{fallback}</>;
  }

  // User has allowed role
  return <>{children}</>;
}
