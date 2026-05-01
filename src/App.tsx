import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/views/Dashboard';
import { Inventory } from './components/views/Inventory';
import { Borrowing } from './components/views/Borrowing';
import { Users } from './components/views/Users';
import { LogIn, FlaskConical, LogOut } from 'lucide-react';
import { RoleSelection } from './components/RoleSelection';

function AppContent() {
  const { user, userRole, loading, signIn, logOut } = useAuth();
  const [currentView, setCurrentView] = useState('inventory');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary-50">
        <div className="flex flex-col items-center gap-4">
          <FlaskConical className="h-12 w-12 animate-pulse text-primary-600" />
          <p className="font-mono text-sm uppercase tracking-widest text-primary-600/70">Loading System</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary-50 px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-2xl shadow-primary-900/5">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-primary-100 p-4">
              <FlaskConical className="h-10 w-10 text-primary-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">
              SLRC Pharmaceutical Chemistry Lab
            </h1>
            <p className="text-sm text-gray-500">
              San Lorenzo Ruiz College<br/>Inventory & Borrowing System
            </p>
          </div>
          
          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary-600 px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (userRole === 'pending') {
    return <RoleSelection />;
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-primary-50">
      {/* Mobile Header */}
      <header className="md:hidden flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-gray-900">SLRC Lab</span>
        </div>
        <button onClick={logOut} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
        <div className="mx-auto max-w-6xl">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'inventory' && <Inventory />}
          {currentView === 'borrowing' && <Borrowing />}
          {currentView === 'users' && <Users />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
