
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAdmin, isLoading, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!isProfileComplete) { 
        router.push(`/complete-profile?redirect=${encodeURIComponent(pathname)}`);
      } else if (!isAdmin) {
         router.push('/'); 
      }
    }
  }, [user, isAdmin, isLoading, router, pathname, isProfileComplete]);

  if (isLoading || !user || !isAdmin || (user && !isProfileComplete)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">
            {isLoading ? "Loading..." : (!user) ? "Redirecting to login..." : (!isProfileComplete) ? "Checking profile..." : "Verifying admin status..."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
