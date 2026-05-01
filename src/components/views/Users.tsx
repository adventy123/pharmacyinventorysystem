import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Shield, User as UserIcon } from 'lucide-react';

export function Users() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users Management</h1>
        <p className="text-sm text-gray-500">Manage user roles and access to the system.</p>
      </div>

      <div className="rounded-2xl md:rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden p-4 md:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-right">Change Role</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersList.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        {u.role === 'admin' ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                      </div>
                      <span className="font-medium text-gray-900">{u.displayName || 'Unknown Name'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 capitalize text-gray-700">{u.role.replace('_', ' ')}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="lab_tech">Lab Tech</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {usersList.map(u => (
            <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  {u.role === 'admin' ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate">{u.displayName || 'Unknown Name'}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 mt-1 border-t border-gray-100">
                <span className="font-medium text-gray-600 capitalize text-xs">Role: {u.role.replace('_', ' ')}</span>
                {isAdmin && (
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-primary-500 bg-white shadow-sm"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="lab_tech">Lab Tech</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            </div>
          ))}
          {usersList.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
