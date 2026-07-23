'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarProvider } from '@/components/admin/SidebarContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="flex min-h-screen bg-[#F9F9F8]">
          <AdminSidebar />
          <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
