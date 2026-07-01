import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, ShieldAlert, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { Customer } from '../types';

export function Customers() {
  const { customers, shipments, payments, settings, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addCustomer({
      companyName: formData.get('companyName') as string,
      contactPerson: formData.get('contactPerson') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      status: formData.get('status') as Customer['status'] || 'Active',
      creditLimit: Number(formData.get('creditLimit')),
    });
    setIsAddModalOpen(false);
  };

  const handleEditCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const formData = new FormData(e.currentTarget);
    updateCustomer({
      ...editingCustomer,
      companyName: formData.get('companyName') as string,
      contactPerson: formData.get('contactPerson') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      status: formData.get('status') as Customer['status'],
      creditLimit: Number(formData.get('creditLimit')),
    });
    setEditingCustomer(null);
  };

  // Get customer specific records for Ledger View
  const customerLedger = useMemo(() => {
    if (!viewingCustomer) return { shipments: [], payments: [] };
    
    const custShipments = shipments.filter(
      s => s.consignorName.toLowerCase() === viewingCustomer.companyName.toLowerCase()
    );
    const custPayments = payments.filter(
      p => p.customerId === viewingCustomer.id
    );

    return {
      shipments: custShipments,
      payments: custPayments
    };
  }, [viewingCustomer, shipments, payments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Customers & Ledgers</h2>
          <p className="text-slate-500">Manage client directory, limits, and review accounts receivable.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/95 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-slate-800">Customer Directory</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search name, city, contact..."
                className="pl-9 bg-slate-50/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company ID & Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                    No customers found. Try adjusting your search query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div>{customer.companyName}</div>
                      <div className="text-xs text-slate-400 font-normal">{customer.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-700">{customer.contactPerson}</div>
                      <div className="text-xs text-slate-400">{customer.phone} | {customer.email}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {customer.city}, {customer.state}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-600">
                      {formatCurrency(customer.creditLimit)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${
                      customer.outstanding > customer.creditLimit ? 'text-rose-600 animate-pulse' : customer.outstanding > 0 ? 'text-amber-600' : 'text-slate-900'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {customer.outstanding > customer.creditLimit && (
                          <ShieldAlert className="h-4 w-4 text-rose-600" title="Credit limit exceeded!" />
                        )}
                        {formatCurrency(customer.outstanding)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50" onClick={() => setViewingCustomer(customer)} title="View Ledger">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" onClick={() => setEditingCustomer(customer)} title="Edit Customer">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => deleteCustomer(customer.id)} title="Delete Customer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl bg-white border animate-in fade-in-50 zoom-in-95 duration-150">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold text-slate-800">Add New Customer</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Company Name</label>
                    <Input name="companyName" required placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                    <Input name="contactPerson" required placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <Input name="phone" required placeholder="e.g. +91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <Input name="email" type="email" required placeholder="e.g. billing@company.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">City</label>
                    <Input name="city" required placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">State</label>
                    <Input name="state" required placeholder="Maharashtra" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Credit Limit ({settings.currency})</label>
                    <Input name="creditLimit" type="number" required defaultValue="500000" min="0" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-white">Save Customer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl bg-white border animate-in fade-in-50 zoom-in-95 duration-150">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold text-slate-800">Edit Customer: {editingCustomer.companyName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleEditCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Company Name</label>
                    <Input name="companyName" required defaultValue={editingCustomer.companyName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Person</label>
                    <Input name="contactPerson" required defaultValue={editingCustomer.contactPerson} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select name="status" defaultValue={editingCustomer.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <Input name="phone" required defaultValue={editingCustomer.phone} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <Input name="email" type="email" required defaultValue={editingCustomer.email} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">City</label>
                    <Input name="city" required defaultValue={editingCustomer.city} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">State</label>
                    <Input name="state" required defaultValue={editingCustomer.state} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Credit Limit ({settings.currency})</label>
                    <Input name="creditLimit" type="number" required defaultValue={editingCustomer.creditLimit} min="0" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>Cancel</Button>
                  <Button type="submit" className="bg-primary text-white">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Detail Drawer / Modal (Ledger View) */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Customer Profile Ledger</span>
                <h3 className="text-2xl font-extrabold text-slate-900">{viewingCustomer.companyName}</h3>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 h-10 w-10" onClick={() => setViewingCustomer(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border mb-6 text-sm">
              <div>
                <p className="text-slate-400 font-medium">Customer ID</p>
                <p className="font-bold text-slate-800">{viewingCustomer.id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Contact Person</p>
                <p className="font-bold text-slate-800">{viewingCustomer.contactPerson}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Phone / Email</p>
                <p className="font-semibold text-slate-700">{viewingCustomer.phone}</p>
                <p className="text-xs text-slate-500">{viewingCustomer.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Registered Address</p>
                <p className="font-semibold text-slate-700">{viewingCustomer.city}, {viewingCustomer.state}</p>
              </div>
              <div className="border-t pt-2 col-span-2 grid grid-cols-2 mt-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium">Credit Allocation</p>
                  <p className="font-bold text-slate-800">{formatCurrency(viewingCustomer.creditLimit)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Current Outstanding Balance</p>
                  <p className={`font-extrabold text-lg ${viewingCustomer.outstanding > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {formatCurrency(viewingCustomer.outstanding)}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipment Booking History */}
            <div className="space-y-3 mb-6">
              <h4 className="font-bold text-slate-800 border-b pb-1 text-base flex justify-between">
                <span>Shipment History (Lorry Receipts)</span>
                <span className="text-xs font-semibold text-slate-500">{customerLedger.shipments.length} records</span>
              </h4>
              <div className="max-h-[220px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="py-2 text-xs">LR Number</TableHead>
                      <TableHead className="py-2 text-xs">Date</TableHead>
                      <TableHead className="py-2 text-xs">Destination</TableHead>
                      <TableHead className="py-2 text-xs">Status</TableHead>
                      <TableHead className="py-2 text-xs text-right">Freight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerLedger.shipments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-slate-400 py-6">
                          No shipments booked.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerLedger.shipments.map(s => (
                        <TableRow key={s.id} className="text-xs">
                          <TableCell className="font-semibold text-blue-600 py-2">{s.lrNumber}</TableCell>
                          <TableCell className="py-2">{s.bookingDate}</TableCell>
                          <TableCell className="py-2">{s.destination}</TableCell>
                          <TableCell className="py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              s.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              s.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {s.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-right font-medium">{formatCurrency(s.freight)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Payment Transaction History */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 border-b pb-1 text-base flex justify-between">
                <span>Receipts & Payments Ledger</span>
                <span className="text-xs font-semibold text-slate-500">{customerLedger.payments.length} receipts</span>
              </h4>
              <div className="max-h-[220px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="py-2 text-xs">Receipt ID</TableHead>
                      <TableHead className="py-2 text-xs">Date</TableHead>
                      <TableHead className="py-2 text-xs">Method</TableHead>
                      <TableHead className="py-2 text-xs">Transaction Ref</TableHead>
                      <TableHead className="py-2 text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerLedger.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-slate-400 py-6">
                          No payments recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerLedger.payments.map(p => (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="font-semibold text-emerald-600 py-2">{p.id}</TableCell>
                          <TableCell className="py-2">{p.paymentDate}</TableCell>
                          <TableCell className="py-2">{p.paymentMode}</TableCell>
                          <TableCell className="py-2 text-slate-500 truncate max-w-[120px]" title={p.transactionId}>{p.transactionId || '-'}</TableCell>
                          <TableCell className="py-2 text-right font-bold text-emerald-600">+{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
