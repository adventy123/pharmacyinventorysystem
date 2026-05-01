import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, getDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Borrowing() {
  const { user, userRole } = useAuth();
  const isAdminOrTech = userRole === 'admin' || userRole === 'lab_tech';

  const [records, setRecords] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    let q = query(collection(db, 'borrowRecords'));
    if (!isAdminOrTech) {
       q = query(collection(db, 'borrowRecords'), where('userId', '==', user.uid));
    }
    const unsubBorrows = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'borrowRecords'));

    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'items'));

    let unsubUsers = () => {};
    if (isAdminOrTech) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (e) => handleFirestoreError(e, OperationType.LIST, 'users'));
    }

    return () => {
      unsubBorrows();
      unsubItems();
      unsubUsers();
    };
  }, [isAdminOrTech, user]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      itemId: formData.get('itemId') as string,
      userId: formData.get('userId') as string,
      quantity: parseInt(formData.get('quantity') as string, 10),
      status: 'borrowed',
      borrowDate: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'borrowRecords'), data);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'borrowRecords');
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'returned') {
        updateData.returnDate = serverTimestamp();
      }
      await updateDoc(doc(db, 'borrowRecords', recordId), updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `borrowRecords/${recordId}`);
    }
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || 'Unknown Item';
  const getUserName = (id: string) => {
    if (id === user?.uid) return 'You';
    return users.find(u => u.id === id)?.displayName || users.find(u => u.id === id)?.email || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Borrowing Records</h1>
          <p className="text-sm text-gray-500">Track borrowed equipment and materials.</p>
        </div>
        {isAdminOrTech && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New Borrow Record
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Item</th>
              <th className="px-6 py-4 font-medium">Borrower</th>
              <th className="px-6 py-4 font-medium">Qty</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium max-w-[120px]">Date</th>
              {isAdminOrTech && <th className="px-6 py-4 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map(record => (
              <tr key={record.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{getItemName(record.itemId)}</td>
                <td className="px-6 py-4 text-gray-600">{getUserName(record.userId)}</td>
                <td className="px-6 py-4 font-mono">{record.quantity}</td>
                <td className="px-6 py-4">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    record.status === 'borrowed' ? 'bg-blue-50 text-blue-700' :
                    record.status === 'returned' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-red-50 text-red-700'
                  )}>
                    {record.status === 'borrowed' && <Clock className="h-3.5 w-3.5" />}
                    {record.status === 'returned' && <CheckCircle className="h-3.5 w-3.5" />}
                    {record.status === 'overdue' && <AlertCircle className="h-3.5 w-3.5" />}
                    <span className="capitalize">{record.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-[120px] truncate">
                  {record.borrowDate?.toDate()?.toLocaleDateString() || 'Pending'}
                </td>
                {isAdminOrTech && (
                  <td className="px-6 py-4 text-right">
                    {record.status !== 'returned' && (
                      <select
                        value={record.status}
                        onChange={(e) => handleStatusChange(record.id, e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500"
                      >
                        <option value="borrowed">Borrowed</option>
                        <option value="overdue">Overdue</option>
                        <option value="returned">Mark Returned</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={isAdminOrTech ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                  No borrowing records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">New Borrow Record</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Item</label>
                <select required name="itemId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500">
                  <option value="">Select an Item...</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.quantity} in stock)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Borrower (User)</label>
                <select required name="userId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500">
                   <option value="">Select a User...</option>
                   {users.map(u => (
                      <option key={u.id} value={u.id}>{u.displayName || u.email} ({u.role})</option>
                   ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                <input required name="quantity" type="number" min="1" defaultValue="1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500" />
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
