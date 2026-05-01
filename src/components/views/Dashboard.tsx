import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Microscope, Activity, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../AuthProvider';

export function Dashboard() {
  const { user, userRole } = useAuth();
  const isAdminOrTech = userRole === 'admin' || userRole === 'lab_tech';

  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    borrowsActive: 0
  });

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      let total = 0;
      let low = 0;
      snap.forEach(doc => {
        total++;
        if (doc.data().quantity < 5) low++;
      });
      setStats(s => ({ ...s, totalItems: total, lowStock: low }));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'items'));

    let q = query(collection(db, 'borrowRecords'));
    if (!isAdminOrTech && user) {
       q = query(collection(db, 'borrowRecords'), where('userId', '==', user.uid));
    }
    const unsubBorrows = onSnapshot(q, (snap) => {
      let active = 0;
      snap.forEach(doc => {
        const status = doc.data().status;
        if (status === 'borrowed' || status === 'overdue') active++;
      });
      setStats(s => ({ ...s, borrowsActive: active }));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'borrowRecords'));

    return () => {
      unsubItems();
      unsubBorrows();
    };
  }, [isAdminOrTech, user]);

  const cards = [
    { title: 'Total Unique Items', value: stats.totalItems, icon: Microscope, color: 'text-primary-600', bg: 'bg-primary-100' },
    { title: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Active Borrows', value: stats.borrowsActive, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of pharmacy lab inventory and activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', card.bg)}>
                <card.icon className={cn('h-6 w-6', card.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
