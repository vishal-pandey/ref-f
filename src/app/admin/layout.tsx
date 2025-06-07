import AdminAuthGuard from '@/components/auth/AdminAuthGuard';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className="py-2">
        {children}
      </div>
    </AdminAuthGuard>
  );
}
