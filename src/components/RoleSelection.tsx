import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { createUserProfile } from '../lib/firebase';
import { Shield, User as UserIcon, FlaskConical, ArrowRight } from 'lucide-react';

export function RoleSelection() {
  const { user, setRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    if (selectedRole === 'admin' && password !== '1234') {
      setError('Incorrect admin password.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await createUserProfile(user, selectedRole);
      setRole(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Failed to create user profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-primary-50 px-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-2xl shadow-primary-900/5">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-primary-100 p-4">
            <FlaskConical className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">
            Welcome to SLRC Lab
          </h1>
          <p className="text-sm text-gray-500">
            Please select your role to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { setSelectedRole('student'); setError(''); }}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all ${
                selectedRole === 'student' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:bg-primary-50/50'
              }`}
            >
              <UserIcon className="h-8 w-8" />
              <span className="font-medium">Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedRole('admin'); setError(''); }}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all ${
                selectedRole === 'admin' 
                  ? 'border-primary-600 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-primary-200 hover:bg-primary-50/50'
              }`}
            >
              <Shield className="h-8 w-8" />
              <span className="font-medium">Admin</span>
            </button>
          </div>

          {selectedRole === 'admin' && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!selectedRole || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
