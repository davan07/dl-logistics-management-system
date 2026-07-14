import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lock, AlertTriangle, X } from 'lucide-react';
import { Customer, Shipment, Payment, Expense, CompanySettings, DashboardStats, Notification, Toast } from '../types';
import { encryptData, decryptData } from '../lib/crypto';


interface DataContextType {
  customers: Customer[];
  shipments: Shipment[];
  payments: Payment[];
  expenses: Expense[];
  settings: CompanySettings;
  stats: DashboardStats;
  addCustomer: (customer: Omit<Customer, 'id' | 'outstanding'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addShipment: (shipment: Omit<Shipment, 'id' | 'bookingDate'>) => void;
  updateShipmentStatus: (id: string, status: Shipment['status']) => void;
  deleteShipment: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => void;
  deletePayment: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'expenseDate'>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (settings: CompanySettings) => void;
  clearData: () => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  notifications: Notification[];
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'DL Logistics Pvt Ltd',
  address: '102, Cargo Terminal 2, Chhatrapati Shivaji International Airport, Mumbai, MH - 400099',
  taxNumber: '27AAAAA1111A1Z1',
  currency: 'INR',
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    companyName: 'Acme Corp',
    contactPerson: 'John Doe',
    phone: '+91 9876543210',
    email: 'john@acme.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'Active',
    creditLimit: 500000,
    outstanding: 0, // Will be computed dynamically
  },
  {
    id: 'CUST-002',
    companyName: 'Global Tech',
    contactPerson: 'Jane Smith',
    phone: '+91 9876543211',
    email: 'jane@globaltech.in',
    city: 'Bangalore',
    state: 'Karnataka',
    status: 'Active',
    creditLimit: 300000,
    outstanding: 0, // Will be computed dynamically
  },
  {
    id: 'CUST-003',
    companyName: 'Rapid Logistics',
    contactPerson: 'Mike Johnson',
    phone: '+91 9876543212',
    email: 'mike@rapid.com',
    city: 'Delhi',
    state: 'Delhi',
    status: 'Inactive',
    creditLimit: 100000,
    outstanding: 0, // Will be computed dynamically
  },
  {
    id: 'CUST-004',
    companyName: 'Sunshine Retail',
    contactPerson: 'Sarah Sen',
    phone: '+91 9876543213',
    email: 'sarah@sunshine.co.in',
    city: 'Kolkata',
    state: 'West Bengal',
    status: 'Active',
    creditLimit: 400000,
    outstanding: 0, // Will be computed dynamically
  }
];

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-1001',
    lrNumber: 'LR-2026-001',
    bookingDate: '2026-06-10',
    consignorName: 'Acme Corp',
    consigneeName: 'Tech Solutions',
    origin: 'Mumbai',
    destination: 'Pune',
    freight: 45000,
    status: 'Delivered',
  },
  {
    id: 'SHP-1002',
    lrNumber: 'LR-2026-002',
    bookingDate: '2026-06-12',
    consignorName: 'Global Tech',
    consigneeName: 'Retail Hub',
    origin: 'Bangalore',
    destination: 'Chennai',
    freight: 55000,
    status: 'In Transit',
  },
  {
    id: 'SHP-1003',
    lrNumber: 'LR-2026-003',
    bookingDate: '2026-06-15',
    consignorName: 'Acme Corp',
    consigneeName: 'Mega Mart',
    origin: 'Mumbai',
    destination: 'Ahmedabad',
    freight: 65000,
    status: 'Booked',
  },
  {
    id: 'SHP-1004',
    lrNumber: 'LR-2026-004',
    bookingDate: '2026-06-18',
    consignorName: 'Sunshine Retail',
    consigneeName: 'East Distributors',
    origin: 'Kolkata',
    destination: 'Guwahati',
    freight: 80000,
    status: 'Delivered',
  },
  {
    id: 'SHP-1005',
    lrNumber: 'LR-2026-005',
    bookingDate: '2026-06-20',
    consignorName: 'Global Tech',
    consigneeName: 'South Cargo',
    origin: 'Bangalore',
    destination: 'Hyderabad',
    freight: 35000,
    status: 'Booked',
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAY-1001',
    customerId: 'CUST-001',
    customerName: 'Acme Corp',
    paymentDate: '2026-06-14',
    amount: 30000,
    paymentMode: 'Bank Transfer',
    transactionId: 'TXN873612',
    referenceNotes: 'Advance payment for LR-2026-001',
  },
  {
    id: 'PAY-1002',
    customerId: 'CUST-002',
    customerName: 'Global Tech',
    paymentDate: '2026-06-19',
    amount: 20000,
    paymentMode: 'UPI',
    transactionId: 'UPI-gt-98321',
    referenceNotes: 'Payment towards outstanding',
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-1001',
    category: 'Fuel',
    amount: 28000,
    expenseDate: '2026-06-11',
    paidTo: 'Bharat Petroleum',
    description: 'Diesel for vehicle MH-04-GP-1234',
  },
  {
    id: 'EXP-1002',
    category: 'Driver Wages',
    amount: 12000,
    expenseDate: '2026-06-15',
    paidTo: 'Ramesh Singh',
    description: 'Driver salary for June trip to Ahmedabad',
  },
  {
    id: 'EXP-1003',
    category: 'Tolls',
    amount: 4500,
    expenseDate: '2026-06-12',
    paidTo: 'NHAI Toll Plaza',
    description: 'Mumbai-Pune Expressway fastag recharge',
  },
  {
    id: 'EXP-1004',
    category: 'Maintenance',
    amount: 15000,
    expenseDate: '2026-06-22',
    paidTo: 'Tata Motors Workshop',
    description: 'Routine servicing and oil replacement',
  }
];

function DeleteConfirmModal({
  type,
  id,
  onClose,
  onConfirm
}: {
  type: string;
  id: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'lokesh', password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await onConfirm();
          onClose();
          return;
        }
      }
      setError('Incorrect password. Action unauthorized.');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-rose-600 mb-4">
          <div className="p-2 bg-rose-50 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Critical Action</h3>
            <p className="text-xs text-slate-500">Two-Step Deletion Verification</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          You are deleting the <strong className="text-slate-900">{type}</strong> record <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-rose-600 text-xs font-semibold">{id}</code>. This action is irreversible.
        </p>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-200 mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="confirm-password">
              Enter Administrator Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to confirm"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors shadow disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {isLoading ? 'Verifying...' : 'Verify & Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const newOptions = { ...options };
  
  if (newOptions.body && typeof newOptions.body === 'string') {
    try {
      const encrypted = await encryptData(newOptions.body);
      newOptions.body = JSON.stringify({ payload: encrypted });
      newOptions.headers = {
        ...newOptions.headers,
        'Content-Type': 'application/json',
      };
    } catch (err) {
      console.error('[DataContext] Encryption failed:', err);
    }
  }

  const res = await window.fetch(url, newOptions);

  if (res.ok && res.headers.get('Content-Type')?.includes('application/json')) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data && data.payload) {
        const decrypted = await decryptData(data.payload);
        res.json = async () => JSON.parse(decrypted);
      }
    } catch (err) {
      // Not encrypted
    }
  }

  return res;
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dllms_authenticated') === 'true';
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'Customer' | 'Shipment' | 'Payment' | 'Expense';
    id: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const data = localStorage.getItem('dllms_settings');
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalOutstanding: 0,
  });

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToast = (message: string, type?: string) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const refreshData = async () => {
    try {
      const [custRes, shpRes, payRes, expRes] = await Promise.all([
        apiFetch('/api/customers'),
        apiFetch('/api/shipments'),
        apiFetch('/api/payments'),
        apiFetch('/api/expenses')
      ]);

      if (custRes.ok && shpRes.ok && payRes.ok && expRes.ok) {
        const [custs, shps, pays, exps] = await Promise.all([
          custRes.json(),
          shpRes.json(),
          payRes.json(),
          expRes.json()
        ]);
        setCustomers(custs);
        setShipments(shps);
        setPayments(pays);
        setExpenses(exps);
      }
    } catch (err) {
      console.warn('[DataContext] Failed to refresh data from API:', err);
    }
  };


  // Load initial data from database API with LocalStorage fallback
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, shpRes, payRes, expRes, notifRes] = await Promise.all([
          apiFetch('/api/customers'),
          apiFetch('/api/shipments'),
          apiFetch('/api/payments'),
          apiFetch('/api/expenses'),
          apiFetch('/api/notifications')
        ]);

        if (custRes.ok && shpRes.ok && payRes.ok && expRes.ok) {
          const [custs, shps, pays, exps] = await Promise.all([
            custRes.json(),
            shpRes.json(),
            payRes.json(),
            expRes.json()
          ]);
          setCustomers(custs);
          setShipments(shps);
          setPayments(pays);
          setExpenses(exps);
          console.log('[DataContext] Successfully connected and loaded data from database API.');

          if (notifRes.ok) {
            const notifs = await notifRes.json();
            setNotifications(notifs);
          }
          return;
        }
      } catch (err) {
        console.warn('[DataContext] API load failed. Falling back to LocalStorage:', err);
      }

      // LocalStorage fallback if API fails
      const c = localStorage.getItem('dllms_customers');
      const s = localStorage.getItem('dllms_shipments');
      const p = localStorage.getItem('dllms_payments');
      const e = localStorage.getItem('dllms_expenses');

      setCustomers(c ? JSON.parse(c) : INITIAL_CUSTOMERS);
      setShipments(s ? JSON.parse(s) : INITIAL_SHIPMENTS);
      setPayments(p ? JSON.parse(p) : INITIAL_PAYMENTS);
      setExpenses(e ? JSON.parse(e) : INITIAL_EXPENSES);
    }
    loadData();
  }, []);


  // Persist and update calculated outstanding amounts and dashboard stats
  useEffect(() => {
    if (customers.length === 0 && shipments.length === 0 && payments.length === 0 && expenses.length === 0) {
      // Prevent running stats calculations on empty mount states if storage fallback hasn't resolved
      return;
    }

    // 1. Calculate and update customers' outstandings dynamically
    const updatedCustomers = customers.map(cust => {
      // Freight of non-cancelled shipments where consignor is this customer
      const totalFreight = shipments
        .filter(ship => ship.consignorName.toLowerCase() === cust.companyName.toLowerCase() && ship.status !== 'Cancelled')
        .reduce((sum, ship) => sum + ship.freight, 0);

      // Payments made by this customer
      const totalPaid = payments
        .filter(pay => pay.customerId === cust.id)
        .reduce((sum, pay) => sum + pay.amount, 0);

      return {
        ...cust,
        outstanding: Math.max(0, totalFreight - totalPaid),
      };
    });

    // Prevent infinite loop by checking if outstandings actually changed
    const outstandingsChanged = JSON.stringify(updatedCustomers) !== JSON.stringify(customers);
    if (outstandingsChanged) {
      setCustomers(updatedCustomers);
      localStorage.setItem('dllms_customers', JSON.stringify(updatedCustomers));
      return;
    }

    // 2. Persist states in local storage
    localStorage.setItem('dllms_customers', JSON.stringify(customers));
    localStorage.setItem('dllms_shipments', JSON.stringify(shipments));
    localStorage.setItem('dllms_payments', JSON.stringify(payments));
    localStorage.setItem('dllms_expenses', JSON.stringify(expenses));
    localStorage.setItem('dllms_settings', JSON.stringify(settings));

    // 3. Compute stats
    const totalRevenue = shipments
      .filter(ship => ship.status !== 'Cancelled')
      .reduce((sum, ship) => sum + ship.freight, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalOutstanding = customers.reduce((sum, cust) => sum + cust.outstanding, 0);

    setStats({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOutstanding,
    });
  }, [shipments, payments, expenses, settings, customers]);

  // Asynchronous API actions
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'outstanding'>) => {
    const nextId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const newCustomer: Customer = {
      ...customerData,
      id: nextId,
      outstanding: 0,
    };

    try {
      const res = await apiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomers(prev => [...prev, saved]);
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to save customer to API:', err);
    }
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = async (updatedCust: Customer) => {
    try {
      const res = await apiFetch(`/api/customers/${updatedCust.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCust),
      });
      if (res.ok) {
        const saved = await res.json();
        setCustomers(prev => prev.map(c => c.id === saved.id ? saved : c));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to update customer in API:', err);
    }
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const executeDeleteCustomer = async (id: string) => {
    try {
      const res = await apiFetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setPayments(prev => prev.filter(p => p.customerId !== id));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to delete customer from API:', err);
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const deleteCustomer = (id: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'Customer',
      id,
      onConfirm: () => executeDeleteCustomer(id),
    });
  };

  const addShipment = async (shipmentData: Omit<Shipment, 'id' | 'bookingDate'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newShipment: Shipment = {
      ...shipmentData,
      id: `SHP-${1000 + shipments.length + 1}`,
      bookingDate: today,
    };

    try {
      const res = await apiFetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShipment),
      });
      if (res.ok) {
        const saved = await res.json();
        setShipments(prev => [...prev, saved]);
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to save shipment to API:', err);
    }
    setShipments(prev => [...prev, newShipment]);
  };

  const updateShipmentStatus = async (id: string, status: Shipment['status']) => {
    const shipment = shipments.find(s => s.id === id);
    if (!shipment) return;
    const updated = { ...shipment, status };

    try {
      const res = await apiFetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const saved = await res.json();
        setShipments(prev => prev.map(s => s.id === id ? saved : s));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to update shipment status in API:', err);
    }
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const executeDeleteShipment = async (id: string) => {
    try {
      const res = await apiFetch(`/api/shipments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShipments(prev => prev.filter(s => s.id !== id));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to delete shipment from API:', err);
    }
    setShipments(prev => prev.filter(s => s.id !== id));
  };

  const deleteShipment = (id: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'Shipment',
      id,
      onConfirm: () => executeDeleteShipment(id),
    });
  };

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'paymentDate'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newPayment: Payment = {
      ...paymentData,
      id: `PAY-${1000 + payments.length + 1}`,
      paymentDate: today,
    };

    try {
      const res = await apiFetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment),
      });
      if (res.ok) {
        const saved = await res.json();
        setPayments(prev => [...prev, saved]);
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to save payment to API:', err);
    }
    setPayments(prev => [...prev, newPayment]);
  };

  const executeDeletePayment = async (id: string) => {
    try {
      const res = await apiFetch(`/api/payments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPayments(prev => prev.filter(p => p.id !== id));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to delete payment from API:', err);
    }
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const deletePayment = (id: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'Payment',
      id,
      onConfirm: () => executeDeletePayment(id),
    });
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'expenseDate'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newExpense: Expense = {
      ...expenseData,
      id: `EXP-${1000 + expenses.length + 1}`,
      expenseDate: today,
    };

    try {
      const res = await apiFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      if (res.ok) {
        const saved = await res.json();
        setExpenses(prev => [...prev, saved]);
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to save expense to API:', err);
    }
    setExpenses(prev => [...prev, newExpense]);
  };

  const executeDeleteExpense = async (id: string) => {
    try {
      const res = await apiFetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        return;
      }
    } catch (err) {
      console.error('[DataContext] Failed to delete expense from API:', err);
    }
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const deleteExpense = (id: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'Expense',
      id,
      onConfirm: () => executeDeleteExpense(id),
    });
  };

  const updateSettings = (updatedSettings: CompanySettings) => {
    setSettings(updatedSettings);
  };

  const clearData = async () => {
    try {
      await Promise.all([
        ...customers.map(c => apiFetch(`/api/customers/${c.id}`, { method: 'DELETE' })),
        ...shipments.map(s => apiFetch(`/api/shipments/${s.id}`, { method: 'DELETE' })),
        ...payments.map(p => apiFetch(`/api/payments/${p.id}`, { method: 'DELETE' })),
        ...expenses.map(e => apiFetch(`/api/expenses/${e.id}`, { method: 'DELETE' }))
      ]);
    } catch (e) {
      console.warn('[DataContext] Failed to clear API data:', e);
    }

    localStorage.removeItem('dllms_customers');
    localStorage.removeItem('dllms_shipments');
    localStorage.removeItem('dllms_payments');
    localStorage.removeItem('dllms_expenses');
    localStorage.removeItem('dllms_settings');
    setCustomers(INITIAL_CUSTOMERS);
    setShipments(INITIAL_SHIPMENTS);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setSettings(DEFAULT_SETTINGS);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          localStorage.setItem('dllms_authenticated', 'true');
          return true;
        }
      }
    } catch (err) {
      console.error('[DataContext] Login API request failed:', err);
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dllms_authenticated');
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/read', {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('[DataContext] Failed to mark notifications as read:', err);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications/clear', {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('[DataContext] Failed to clear notifications:', err);
      setNotifications([]);
    }
  };

  // WebSocket Connection for Real-time Notifications & Sync
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number;

    function connectWS() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-proxy`;
      console.log(`[WS] Connecting to ${wsUrl}...`);
      
      ws = new WebSocket(wsUrl);

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.payload) {
            const decrypted = await decryptData(data.payload);
            const message = JSON.parse(decrypted);
            console.log('[WS] Received message:', message);

            if (message.type === 'INIT_NOTIFICATIONS') {
              setNotifications(message.notifications);
            } else if (message.type === 'NEW_NOTIFICATION') {
              setNotifications(prev => [message.notification, ...prev]);
              addToast(message.notification.message, message.notification.type);
            } else if (message.type === 'DATA_CHANGE') {
              refreshData();
            }
          }
        } catch (err) {
          console.error('[WS] Error processing message:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Connection closed. Attempting reconnect in 3s...');
        reconnectTimeout = window.setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Connection error:', err);
        ws?.close();
      };
    }

    connectWS();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);


  return (
    <DataContext.Provider
      value={{
        customers,
        shipments,
        payments,
        expenses,
        settings,
        stats,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addShipment,
        updateShipmentStatus,
        deleteShipment,
        addPayment,
        deletePayment,
        addExpense,
        deleteExpense,
        updateSettings,
        clearData,
        isAuthenticated,
        login,
        logout,
        notifications,
        markAllNotificationsAsRead,
        clearAllNotifications,
        toasts,
        removeToast,
      }}
    >
      {children}
      {confirmModal && confirmModal.isOpen && (
        <DeleteConfirmModal
          type={confirmModal.type}
          id={confirmModal.id}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
