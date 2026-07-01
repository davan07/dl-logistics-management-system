import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Fuel, DollarSign, ShieldAlert, Wrench, Building, HelpCircle, Receipt } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { Expense } from '../types';

export function Expenses() {
  const { expenses, settings, addExpense, deleteExpense } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = 
        e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addExpense({
      category: formData.get('category') as Expense['category'],
      amount: Number(formData.get('amount')),
      paidTo: formData.get('paidTo') as string,
      description: formData.get('description') as string,
    });
    
    setIsAddModalOpen(false);
  };

  const getCategoryIcon = (category: Expense['category']) => {
    switch (category) {
      case 'Fuel':
        return <Fuel className="h-4 w-4 text-amber-600" />;
      case 'Driver Wages':
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'Tolls':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-rose-600" />;
      case 'Rent/Office':
        return <Building className="h-4 w-4 text-violet-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Operational Expenses</h2>
          <p className="text-slate-500 font-medium">Record fuel, driver wages, vehicle maintenance, and office overheads.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-rose-600 hover:bg-rose-600/95 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-slate-800">Expense Logs</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search Paid To, Ref Notes..."
                  className="pl-9 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="All">All Categories</option>
                <option value="Fuel">Fuel</option>
                <option value="Driver Wages">Driver Wages</option>
                <option value="Tolls">Tolls</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rent/Office">Rent/Office</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher ID & Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Description / Reference</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                    No expense logs found. Record vehicle overheads or office costs to balance accounts.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.slice().reverse().map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div className="text-rose-600 font-bold">{expense.id}</div>
                      <div className="text-xs text-slate-400 font-normal">{expense.expenseDate}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        {getCategoryIcon(expense.category)}
                        <span>{expense.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">{expense.paidTo}</TableCell>
                    <TableCell className="text-slate-600 text-sm max-w-[250px] truncate" title={expense.description}>
                      {expense.description || '-'}
                    </TableCell>
                    <TableCell className="text-right font-black text-rose-600">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => deleteExpense(expense.id)} title="Delete Voucher">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <Card className="w-full max-w-lg shadow-2xl bg-white border animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold text-slate-800">Record Operational Expense</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Expense Category</label>
                    <select name="category" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="Fuel">Fuel</option>
                      <option value="Driver Wages">Driver Wages</option>
                      <option value="Tolls">Tolls</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Rent/Office">Rent/Office</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Paid To (Vendor/Employee)</label>
                    <Input name="paidTo" required placeholder="e.g. Bharat Petroleum, Driver Ram, NHAI Tolls" />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Amount Paid ({settings.currency})</label>
                    <Input name="amount" type="number" required defaultValue="10000" min="1" />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Description / Vehicle Reference</label>
                    <Input name="description" placeholder="e.g. Diesel recharge for vehicle MH-04-GP-1234, Fastag topup" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-rose-600 text-white hover:bg-rose-650">Record Voucher</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
