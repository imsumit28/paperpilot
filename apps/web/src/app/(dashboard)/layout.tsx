import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import { NotificationToast } from '@/components/notifications/NotificationToast';
import { CommandPalette } from '@/components/command/CommandPalette';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-surface-page lg:p-4">
        <div className="flex gap-4 max-w-[1600px] mx-auto h-full">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto pb-24 lg:pb-4">{children}</main>
        </div>
        <MobileBottomNav />
        <NotificationsProvider />
        <NotificationToast />
        <CommandPalette />
      </div>
    </AuthGuard>
  );
}
