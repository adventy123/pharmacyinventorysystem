import React from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, LayoutDashboard, Microscope, ClipboardList, Users, FlaskConical } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar({ currentView, onNavigate }: { currentView: string; onNavigate: (view: string) => void }) {
  const { user, userRole, logOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Microscope },
    { id: 'borrowing', label: 'Borrowing', icon: ClipboardList },
  ];

  // Only show users to admin/lab tech
  if (userRole === 'admin' || userRole === 'lab_tech') {
    navItems.push({ id: 'users', label: 'Users', icon: Users });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 flex-shrink-0 flex-col items-center border-r border-primary-900 bg-primary-950 py-6 shadow-2xl">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-500/20 text-secondary-500">
          <FlaskConical className="h-6 w-6" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-4 w-full px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ease-in-out',
                currentView === item.id
                  ? 'bg-secondary-500 text-white shadow-lg shadow-secondary-500/30'
                  : 'text-primary-300 hover:bg-primary-900 hover:text-white'
              )}
              title={item.label}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                  currentView === item.id ? 'scale-110' : 'group-hover:scale-110'
                )}
              />
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-colors w-full',
              currentView === item.id
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <item.icon className={cn('h-5 w-5 transition-transform', currentView === item.id ? 'text-secondary-500 scale-110' : 'text-gray-400')} />
            <span className={cn("truncate max-w-[64px] text-[10px]", currentView === item.id ? "text-secondary-600 font-semibold" : "")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
