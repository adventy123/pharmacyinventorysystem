import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/views/Dashboard';
import { Inventory } from './components/views/Inventory';
import { Borrowing } from './components/views/Borrowing';
import { Users } from './components/views/Users';
import { LogIn, FlaskConical, LogOut, Search, Bell, Calendar, ChevronDown } from 'lucide-react';
import { RoleSelection } from './components/RoleSelection';

function AppContent() {
  const { user, userRole, loading, signIn, logOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <FlaskConical className="h-12 w-12 animate-pulse text-primary-600" />
          <p className="font-mono text-sm uppercase tracking-widest text-primary-600/70">Loading System</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[100dvh] w-full flex-col relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 md:items-center md:justify-center overflow-hidden">
        
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-primary-500/30 blur-3xl mix-blend-screen"></div>
            <div className="absolute top-[30%] -left-[10%] w-[50vw] h-[50vw] md:w-[20vw] md:h-[20vw] rounded-full bg-secondary-500/20 blur-3xl mix-blend-screen"></div>
        </div>

        {/* Top Section / Logo */}
        <div className="flex flex-1 md:flex-none md:mb-10 items-center justify-center p-8 pb-4 z-10 w-full">
          <div className="relative flex flex-col items-center">
             <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl transition-transform hover:scale-105 duration-500 overflow-hidden p-4">
               <img src="/SLRCLogo.png" alt="SLRC Logo" className="h-full w-full object-contain drop-shadow-md" />
             </div>
          </div>
        </div>

        {/* Bottom Sheet Section */}
        <div className="w-full shrink-0 rounded-t-[2.5rem] bg-white px-8 pt-12 pb-14 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col items-center text-center z-10 md:max-w-md md:rounded-[2.5rem] md:shadow-2xl md:shrink md:flex-none md:mb-12">
          
          <h1 className="mb-3 text-2xl md:text-3xl font-bold tracking-tight text-primary-600 uppercase">
            SLRC LAB INVENTORY SYSTEM
          </h1>
          
          <h2 className="mb-4 text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            Modernizing the<br/>Pharmacy Workspace
          </h2>

          <p className="mb-10 text-sm md:text-base text-gray-500 leading-relaxed px-4 max-w-[300px]">
            Organize your lab workflow and manage inventory easily all in one simple, powerful app.
          </p>
          
          <button
            onClick={signIn}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-primary-600 px-4 py-4 md:py-5 text-base md:text-lg font-bold text-white transition-all hover:bg-primary-700 hover:shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] active:scale-[0.98]"
          >
            <LogIn className="h-5 w-5 md:h-6 md:w-6" />
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (userRole === 'pending') {
    return <RoleSelection />;
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden bg-transparent">
      {/* Mobile Top Header */}
      <header className="md:hidden flex h-16 items-center justify-between bg-primary-950 px-4 shrink-0 text-white z-40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500/20 text-secondary-500">
            <FlaskConical className="h-5 w-5" />
          </div>
          <span className="font-semibold">SLRC Lab</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover shadow-sm border border-primary-800" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-800 text-xs font-semibold text-white">
              {user?.email?.[0].toUpperCase()}
            </div>
          )}
          <button onClick={logOut} className="p-2 text-primary-200 hover:text-red-400 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-24 shrink-0 items-center justify-between px-8">
          {/* Search Bar */}
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search here"
              className="w-full rounded-full bg-white px-12 py-3.5 text-sm outline-none placeholder:text-gray-400 shadow-sm border border-gray-100 focus:border-primary-200 focus:ring-4 focus:ring-primary-50 transition-all"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:text-primary-600 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:text-primary-600 transition-colors">
              <Calendar className="h-5 w-5" />
            </button>
            <button onClick={logOut} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm border border-gray-100 hover:text-red-600 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
            
            <div className="ml-4 flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-colors">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
              <div className="flex flex-col hidden lg:flex">
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {user?.displayName || 'User'}
                </span>
                <span className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ')}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden lg:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 md:px-8 md:py-0 md:pb-8">
          <div className="mx-auto max-w-[1400px]">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'inventory' && <Inventory />}
            {currentView === 'borrowing' && <Borrowing />}
            {currentView === 'users' && <Users />}
          </div>
        </main>
      </div>
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
