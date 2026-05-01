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

    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <FlaskConical className="h-6 w-6 text-primary-600" />
          <span className="font-semibold text-gray-900">SLRC Lab</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                currentView === item.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  currentView === item.id ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full bg-gray-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                {user?.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                {user?.displayName || 'User'}
              </span>
              <span className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ')}</span>
            </div>
          </div>
          <button
            onClick={logOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Sign out
          </button>
        </div>
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
            <item.icon className={cn('h-5 w-5', currentView === item.id ? 'text-primary-600' : 'text-gray-400')} />
            <span className="truncate max-w-[64px] text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
}
