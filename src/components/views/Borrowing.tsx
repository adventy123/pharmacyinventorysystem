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
  
  // Multiple Items State
  const [borrowRequests, setBorrowRequests] = useState([{ itemId: '', quantity: 1 }]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      setSelectedUserId(user.uid);
    }

    return () => {
      unsubBorrows();
      unsubItems();
      unsubUsers();
    };
  }, [isAdminOrTech, user]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId) return alert("Please select a user.");
    
    // Filter out incomplete requests
    const validRequests = borrowRequests.filter(req => req.itemId && req.quantity > 0);
    if (validRequests.length === 0) return alert("Please add at least one item.");

    setIsSubmitting(true);
    try {
      // Create a separate record for each item requested
      for (const req of validRequests) {
        const data = {
          itemId: req.itemId,
          userId: selectedUserId,
          quantity: req.quantity,
          status: 'borrowed',
          borrowDate: serverTimestamp()
        };
        await addDoc(collection(db, 'borrowRecords'), data);
      }
      setIsModalOpen(false);
      setBorrowRequests([{ itemId: '', quantity: 1 }]);
      if (isAdminOrTech) setSelectedUserId('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'borrowRecords');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRequestRow = () => {
    setBorrowRequests([...borrowRequests, { itemId: '', quantity: 1 }]);
  };
  
  const updateRequestRow = (index: number, field: string, value: string | number) => {
    const newRequests = [...borrowRequests];
    newRequests[index] = { ...newRequests[index], [field]: value };
    setBorrowRequests(newRequests);
  };
  
  const removeRequestRow = (index: number) => {
    if (borrowRequests.length === 1) return;
    setBorrowRequests(borrowRequests.filter((_, i) => i !== index));
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
  const getItemUnit = (id: string) => items.find(i => i.id === id)?.unit || '';
  const getUserName = (id: string) => {
    if (id === user?.uid) return 'You';
    return users.find(u => u.id === id)?.displayName || users.find(u => u.id === id)?.email || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Borrowing Records</h1>
          <p className="text-sm text-gray-500 hidden sm:block">Track borrowed equipment and materials.</p>
        </div>
        {isAdminOrTech && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 shrink-0"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New Record</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl md:rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden p-4 md:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
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
                <tr key={record.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{getItemName(record.itemId)}</td>
                  <td className="px-6 py-4 text-gray-600">{getUserName(record.userId)}</td>
                  <td className="px-6 py-4 font-mono">{record.quantity} {getItemUnit(record.itemId)}</td>
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
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 bg-white"
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

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4">
          {records.map(record => (
            <div key={record.id} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{getItemName(record.itemId)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{record.borrowDate?.toDate()?.toLocaleDateString() || 'Pending'}</p>
                </div>
                <span className={cn('shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium capitalize',
                  record.status === 'borrowed' ? 'bg-blue-50 text-blue-700' :
                  record.status === 'returned' ? 'bg-emerald-50 text-emerald-700' :
                  'bg-red-50 text-red-700'
                )}>
                  {record.status === 'borrowed' && <Clock className="h-3 w-3" />}
                  {record.status === 'returned' && <CheckCircle className="h-3 w-3" />}
                  {record.status === 'overdue' && <AlertCircle className="h-3 w-3" />}
                  {record.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 mt-1 border-t border-gray-100">
                <div className="flex flex-col gap-1 pr-2">
                  <span className="text-gray-500 text-xs truncate max-w-[140px]">{getUserName(record.userId)}</span>
                  <span className="font-mono font-medium text-gray-700 text-xs">Qty: {record.quantity} {getItemUnit(record.itemId)}</span>
                </div>
                {isAdminOrTech && record.status !== 'returned' && (
                  <select
                    value={record.status}
                    onChange={(e) => handleStatusChange(record.id, e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-primary-500 bg-white shadow-sm"
                  >
                    <option value="borrowed">Borrowed</option>
                    <option value="overdue">Overdue</option>
                    <option value="returned">Return</option>
                  </select>
                )}
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">
              No borrowing records found.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">New Borrow Request</h2>
            <form onSubmit={handleSave} className="space-y-6">
              
              {isAdminOrTech && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Borrower (User)</label>
                  <select 
                    required 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                     <option value="">Select a User...</option>
                     {users.map(u => (
                        <option key={u.id} value={u.id}>{u.displayName || u.email} ({u.role})</option>
                     ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Items to Borrow</label>
                  <button 
                    type="button" 
                    onClick={addRequestRow}
                    className="text-xs font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {borrowRequests.map((req, index) => (
                    <div key={index} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl">
                      <div className="flex-1 space-y-3">
                        <select 
                          required 
                          value={req.itemId}
                          onChange={(e) => updateRequestRow(index, 'itemId', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 bg-white"
                        >
                          <option value="">Select an Item...</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} in stock)</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">Qty:</span>
                          <input 
                            required 
                            type="number" 
                            min="1" 
                            value={req.quantity}
                            onChange={(e) => updateRequestRow(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-primary-500 bg-white" 
                          />
                        </div>
                      </div>
                      {borrowRequests.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeRequestRow(index)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Borrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
