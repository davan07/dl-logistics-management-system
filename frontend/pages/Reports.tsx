import React, { useMemo } from 'react';
import { Download, BarChart3, IndianRupee, PieChart as PieIcon, ArrowRightLeft, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';

export function Reports() {
  const { shipments, expenses, customers, payments, settings } = useData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 1. Calculate expense distribution for Pie Chart
  const expensePieData = useMemo(() => {
    const categories: { [key: string]: number } = {
      'Fuel': 0,
      'Driver Wages': 0,
      'Tolls': 0,
      'Maintenance': 0,
      'Rent/Office': 0,
      'Miscellaneous': 0,
    };

    expenses.forEach(e => {
      if (categories[e.category] !== undefined) {
        categories[e.category] += e.amount;
      } else {
        categories['Miscellaneous'] += e.amount;
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [expenses]);

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];

  // 2. Calculate customer sales share for Bar Chart
  const customerSalesData = useMemo(() => {
    const salesMap: { [key: string]: number } = {};
    customers.forEach(c => {
      salesMap[c.companyName] = 0;
    });

    shipments.forEach(s => {
      if (s.status === 'Cancelled') return;
      if (salesMap[s.consignorName] !== undefined) {
        salesMap[s.consignorName] += s.freight;
      }
    });

    return Object.entries(salesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [customers, shipments]);

  // 3. Customer Ledger Summary Table calculation
  const customerLedgerList = useMemo(() => {
    return customers.map(cust => {
      const totalFreight = shipments
        .filter(s => s.consignorName.toLowerCase() === cust.companyName.toLowerCase() && s.status !== 'Cancelled')
        .reduce((sum, s) => sum + s.freight, 0);

      const totalPaid = payments
        .filter(p => p.customerId === cust.id)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        id: cust.id,
        companyName: cust.companyName,
        totalFreight,
        totalPaid,
        outstanding: cust.outstanding,
        status: cust.outstanding === 0 && totalFreight > 0 ? 'Settled' : cust.outstanding > cust.creditLimit ? 'Over Limit' : cust.outstanding > 0 ? 'Pending Settle' : 'No Activity',
      };
    });
  }, [customers, shipments, payments]);

  // 4. Client CSV Export utility
  const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLedgerCSV = () => {
    const headers = ['Customer ID', 'Company Name', 'Total Booked Freight', 'Total Payments Settled', 'Outstanding Balance', 'Ledger Status'];
    const rows = customerLedgerList.map(item => [
      item.id,
      item.companyName,
      item.totalFreight.toString(),
      item.totalPaid.toString(),
      item.outstanding.toString(),
      item.status
    ]);
    exportToCSV(`Customer_Balances_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportShipmentsCSV = () => {
    const headers = ['LR Number', 'Booking Date', 'Consignor', 'Consignee', 'Origin', 'Destination', 'Freight Charges', 'Transit Status'];
    const rows = shipments.map(s => [
      s.lrNumber,
      s.bookingDate,
      s.consignorName,
      s.consigneeName,
      s.origin,
      s.destination,
      s.freight.toString(),
      s.status
    ]);
    exportToCSV(`Shipment_Logs_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportExpensesCSV = () => {
    const headers = ['Voucher ID', 'Date', 'Category', 'Paid To', 'Reference/Description', 'Amount'];
    const rows = expenses.map(e => [
      e.id,
      e.expenseDate,
      e.category,
      e.paidTo,
      e.description || '',
      e.amount.toString()
    ]);
    exportToCSV(`Expense_Register_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Financial Reports & Auditing</h2>
          <p className="text-slate-500 font-medium">Export general ledgers, examine cost structures, and verify cargo metrics.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button onClick={handleExportLedgerCSV} className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
            <Download className="mr-2 h-4 w-4" /> Export Ledger CSV
          </Button>
          <Button onClick={handleExportShipmentsCSV} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Shipments CSV
          </Button>
          <Button onClick={handleExportExpensesCSV} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
            <Download className="mr-2 h-4 w-4" /> Expenses CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-amber-500" />
              Expense Distribution By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                No expense logs recorded.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="h-[250px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-2">
                  {expensePieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span>{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Billings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Top Clients By Booked Freight
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customerSalesData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                No shipments booked.
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" name="Freight Booked" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* General Ledgers / Balance sheet */}
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-500" />
            Client Balance Statement (Ledger Summary)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead className="text-right">Freight Booked</TableHead>
                <TableHead className="text-right">Receipts Settle</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-center">Ledger Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerLedgerList.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold text-slate-500 text-xs">{item.id}</TableCell>
                  <TableCell className="font-bold text-slate-800">{item.companyName}</TableCell>
                  <TableCell className="text-right font-medium text-slate-600">{formatCurrency(item.totalFreight)}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">+{formatCurrency(item.totalPaid)}</TableCell>
                  <TableCell className={`text-right font-black ${item.outstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {formatCurrency(item.outstanding)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.status === 'Settled' ? 'bg-green-100 text-green-800' :
                      item.status === 'Over Limit' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                      item.status === 'Pending Settle' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
