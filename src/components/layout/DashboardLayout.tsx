import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import type { UserRole } from '../../types';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar role={role === 'admin' ? 'admin' : role === 'authority' ? 'authority' : 'citizen'} />
      <main className="flex-1 ml-60 min-h-screen transition-all duration-300" style={{ marginLeft: 240 }}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
