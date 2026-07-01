export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: 'Active' | 'Inactive';
  creditLimit: number;
  outstanding: number;
}

export interface Shipment {
  id: string;
  lrNumber: string;
  bookingDate: string;
  consignorName: string;
  consigneeName: string;
  origin: string;
  destination: string;
  freight: number;
  status: 'Booked' | 'In Transit' | 'Delivered' | 'Cancelled';
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOutstanding: number;
}

export interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  transactionId?: string;
  referenceNotes?: string;
}

export interface Expense {
  id: string;
  category: 'Fuel' | 'Driver Wages' | 'Tolls' | 'Maintenance' | 'Rent/Office' | 'Miscellaneous';
  amount: number;
  expenseDate: string;
  paidTo: string;
  description?: string;
}

export interface CompanySettings {
  companyName: string;
  address: string;
  taxNumber: string;
  currency: string;
}

