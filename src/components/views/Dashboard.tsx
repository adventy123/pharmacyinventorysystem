import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Microscope, Activity, AlertTriangle, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';

export function Dashboard() {
  const { user, userRole } = useAuth();
  const isAdminOrTech = userRole === 'admin' || userRole === 'lab_tech';

  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    borrowsActive: 0,
    totalUsers: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Stats: Items
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      let total = 0;
      let low = 0;
      const map: Record<string, string> = {};
      snap.forEach(doc => {
        total++;
        if (doc.data().quantity < 5) low++;
        map[doc.id] = doc.data().name;
      });
      setStats(s => ({ ...s, totalItems: total, lowStock: low }));
      setItemsMap(map);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'items'));

    // Stats: Borrows & Recent Activity
    let borrowsQuery = query(collection(db, 'borrowRecords'));
    if (!isAdminOrTech && user) {
       borrowsQuery = query(collection(db, 'borrowRecords'), where('userId', '==', user.uid));
    }
    const unsubBorrows = onSnapshot(borrowsQuery, (snap) => {
      let active = 0;
      const allRecords: any[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'borrowed' || data.status === 'overdue') active++;
        allRecords.push({ id: doc.id, ...data });
      });
      setStats(s => ({ ...s, borrowsActive: active }));
      
      // Sort in memory since we might not have a composite index for where + orderBy
      allRecords.sort((a, b) => (b.borrowDate?.toMillis() || 0) - (a.borrowDate?.toMillis() || 0));
      setRecentActivity(allRecords.slice(0, 5));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'borrowRecords'));

    // Stats: Users (only for admin/tech)
    let unsubUsers = () => {};
    if (isAdminOrTech) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const map: Record<string, string> = {};
        snap.forEach(doc => {
          map[doc.id] = doc.data().displayName || doc.data().email || 'User';
        });
        setStats(s => ({ ...s, totalUsers: snap.size }));
        setUsersMap(map);
      }, (e) => handleFirestoreError(e, OperationType.LIST, 'users'));
    }

    return () => {
      unsubItems();
      unsubBorrows();
      unsubUsers();
    };
  }, [isAdminOrTech, user]);

  const cards = [
    { title: 'Total Items', value: stats.totalItems, icon: Microscope, solid: true },
    { title: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, solid: false },
    { title: 'Active Borrows', value: stats.borrowsActive, icon: Activity, solid: false },
  ];
  
  if (isAdminOrTech) {
    cards.push({ title: 'Total Users', value: stats.totalUsers, icon: Users, solid: false });
  }

  return (
    <div className="space-y-8">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className={cn(
              "rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[160px]",
              card.solid ? "bg-secondary-500 text-white" : "bg-white border border-gray-100"
            )}
          >
            <div>
              <p className={cn("text-sm font-medium", card.solid ? "text-white/80" : "text-gray-500")}>
                {card.title}
              </p>
              <p className={cn("mt-2 text-4xl font-bold tracking-tight", card.solid ? "text-white" : "text-gray-900")}>
                {card.value}
              </p>
            </div>
            <div className={cn(
              "self-end rounded-full p-3 mt-4",
              card.solid ? "bg-white/20 text-white" : "bg-gray-50 text-gray-400"
            )}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-[2rem] bg-white p-8 shadow-sm border border-gray-100">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Borrowings</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="border-b border-gray-100 text-gray-400">
              <tr>
                <th className="pb-4 font-medium">Item Name</th>
                {isAdminOrTech && <th className="pb-4 font-medium">Borrower</th>}
                <th className="pb-4 font-medium">Date</th>
                <th className="pb-4 font-medium">Qty</th>
                <th className="pb-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity.map(record => (
                <tr key={record.id} className="group">
                  <td className="py-4 font-medium text-gray-900">
                    {itemsMap[record.itemId] || 'Unknown Item'}
                  </td>
                  {isAdminOrTech && (
                    <td className="py-4 text-gray-500">
                      {usersMap[record.userId] || 'Unknown User'}
                    </td>
                  )}
                  <td className="py-4 text-gray-500">
                    {record.borrowDate?.toDate()?.toLocaleDateString() || 'Pending'}
                  </td>
                  <td className="py-4 font-mono text-gray-600">x{record.quantity}</td>
                  <td className="py-4">
                    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                      record.status === 'borrowed' ? 'bg-secondary-50 text-secondary-700' :
                      record.status === 'returned' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-red-50 text-red-700'
                    )}>
                      <span className="capitalize">{record.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={isAdminOrTech ? 5 : 4} className="py-8 text-center text-gray-500">
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
