import { Customer, Shipment, DashboardStats, ChartData } from './types';

export const MOCK_STATS: DashboardStats = {
  totalRevenue: 1250000,
  totalExpenses: 850000,
  netProfit: 400000,
  totalOutstanding: 320000,
};

export const MOCK_CHART_DATA: ChartData[] = [
  { name: 'Jan', revenue: 400000, expenses: 240000 },
  { name: 'Feb', revenue: 300000, expenses: 139800 },
  { name: 'Mar', revenue: 200000, expenses: 98000 },
  { name: 'Apr', revenue: 278000, expenses: 390800 },
  { name: 'May', revenue: 189000, expenses: 48000 },
  { name: 'Jun', revenue: 239000, expenses: 38000 },
  { name: 'Jul', revenue: 349000, expenses: 43000 },
];

export const MOCK_CUSTOMERS: Customer[] = [
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
    outstanding: 120000,
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
    outstanding: 45000,
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
    outstanding: 0,
  },
];

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-1001',
    lrNumber: 'LR-2024-001',
    bookingDate: '2024-05-10',
    consignorName: 'Acme Corp',
    consigneeName: 'Tech Solutions',
    origin: 'Mumbai',
    destination: 'Pune',
    freight: 15000,
    status: 'Delivered',
  },
  {
    id: 'SHP-1002',
    lrNumber: 'LR-2024-002',
    bookingDate: '2024-05-12',
    consignorName: 'Global Tech',
    consigneeName: 'Retail Hub',
    origin: 'Bangalore',
    destination: 'Chennai',
    freight: 22000,
    status: 'In Transit',
  },
  {
    id: 'SHP-1003',
    lrNumber: 'LR-2024-003',
    bookingDate: '2024-05-14',
    consignorName: 'Acme Corp',
    consigneeName: 'Mega Mart',
    origin: 'Mumbai',
    destination: 'Ahmedabad',
    freight: 18500,
    status: 'Booked',
  },
];
