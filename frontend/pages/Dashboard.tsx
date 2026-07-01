import React, { useMemo } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle, Ship, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { useData } from '../context/DataContext';

export function Dashboard() {
  const { stats, shipments, expenses, customers, settings } = useData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Dynamic aggregation of monthly chart data (Revenue vs Expenses) for last 6 months
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const dataMap: { [key: string]: { name: string; revenue: number; expenses: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const yearName = d.getFullYear().toString().slice(-2);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      dataMap[key] = { name: `${monthName} '${yearName}`, revenue: 0, expenses: 0 };
    }

    // Populate revenue from shipments (excluding Cancelled)
    shipments.forEach(ship => {
      if (ship.status === 'Cancelled') return;
      const date = new Date(ship.bookingDate);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (dataMap[key]) {
        dataMap[key].revenue += ship.freight;
      }
    });

    // Populate expenses
    expenses.forEach(exp => {
      const date = new Date(exp.expenseDate);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (dataMap[key]) {
        dataMap[key].expenses += exp.amount;
      }
    });

    return Object.values(dataMap);
  }, [shipments, expenses]);

  // Calculate quick metrics
  const activeShipmentsCount = useMemo(() => {
    return shipments.filter(s => s.status === 'Booked' || s.status === 'In Transit').length;
  }, [shipments]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 4);
  }, [customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{settings.companyName}</h2>
          <p className="text-slate-500 mt-1">Real-time overview of your logistics and ledger health.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 text-xs bg-white px-3 py-2 rounded-lg border shadow-sm items-center text-slate-600">
          <Clock className="h-4 w-4 text-primary" />
          <span>System Currency: <span className="font-semibold text-primary">{settings.currency}</span></span>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <IndianRupee className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-green-600 flex items-center mt-1 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" /> Healthy cash generation
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Total Expenses</CardTitle>
            <div className="p-2 rounded-lg bg-red-50">
              <IndianRupee className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-red-500 flex items-center mt-1 font-medium">
              <TrendingDown className="h-3 w-3 mr-1" /> Fuel & operational costs
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Net Profit</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.netProfit)}</div>
            <p className="text-xs text-slate-600 mt-1">
              Net margin: <span className="font-semibold text-emerald-600">
                {stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0}%
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Total Outstanding</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalOutstanding)}</div>
            <p className="text-xs text-slate-600 mt-1">
              Active Shipments: <span className="font-semibold text-primary">{activeShipmentsCount}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Outstanding Customers */}
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Top Outstanding Ledgers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((cust) => (
                <div key={cust.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{cust.companyName}</h4>
                    <p className="text-xs text-slate-500">{cust.contactPerson}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(cust.outstanding)}</span>
                    <div className="text-xs text-slate-400">Limit: {formatCurrency(cust.creditLimit)}</div>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">No customers found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Shipments */}
        <Card className="col-span-7 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Shipments (LR)</CardTitle>
            <span className="text-xs text-slate-400">Showing last 5 entries</span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>LR No.</TableHead>
                  <TableHead>Consignor</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Freight Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.slice(-5).reverse().map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium text-blue-600">{shipment.lrNumber}</TableCell>
                    <TableCell>{shipment.consignorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-slate-600">
                        <span>{shipment.origin}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                        shipment.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {shipment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(shipment.freight)}</TableCell>
                  </TableRow>
                ))}
                {shipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                      No shipments booked yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
