import React, { useState, useMemo } from 'react';
import { Plus, Search, Printer, Trash2, X, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { Payment } from '../types';

export function Payments() {
  const { payments, customers, settings, addPayment, deletePayment } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [payments, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    addPayment({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName,
      amount: Number(paymentAmount),
      paymentMode: new FormData(e.currentTarget).get('paymentMode') as Payment['paymentMode'],
      transactionId: new FormData(e.currentTarget).get('transactionId') as string,
      referenceNotes: new FormData(e.currentTarget).get('referenceNotes') as string,
    });
    
    // reset form
    setIsAddModalOpen(false);
    setSelectedCustomerId('');
    setPaymentAmount('');
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Collections & Payments</h2>
          <p className="text-slate-500 font-medium">Record client payments, reduce outstandings, and print receipts.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-600/95 text-white">
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-slate-800">Collections History</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search Client or Receipt ID..."
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
                <TableHead>Receipt ID & Date</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Reference / Txn ID</TableHead>
                <TableHead className="text-right">Amount Received</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-400">
                    No payment receipts found. Record a payment to settle client balances.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.slice().reverse().map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div className="text-emerald-600 font-bold">{payment.id}</div>
                      <div className="text-xs text-slate-400 font-normal">{payment.paymentDate}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">{payment.customerName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {payment.paymentMode}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {payment.transactionId || '-'}
                      {payment.referenceNotes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-[200px] truncate" title={payment.referenceNotes}>
                          "{payment.referenceNotes}"
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-600">
                      +{formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50" onClick={() => setPrintingPayment(payment)} title="Print Receipt">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => deletePayment(payment.id)} title="Delete Voucher">
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

      {/* Record Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <Card className="w-full max-w-lg shadow-2xl bg-white border animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold text-slate-800">Record Customer Payment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Customer Profile</label>
                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Choose Client Profile --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} (Outstanding: {formatCurrency(c.outstanding)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div className="bg-slate-50 border p-3 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-500">Total Account Balance</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedCustomer.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-500">Unsettled Outstanding</p>
                      <p className={`text-sm font-extrabold ${selectedCustomer.outstanding > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {formatCurrency(selectedCustomer.outstanding)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Amount Settle ({settings.currency})</label>
                    <Input 
                      type="number" 
                      required 
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount received" 
                      min="1"
                    />
                  </div>

                  {selectedCustomer && paymentAmount && Number(paymentAmount) > selectedCustomer.outstanding && (
                    <div className="col-span-2 flex gap-2 items-start p-2.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Overpayment warning:</span> Settle amount ({formatCurrency(Number(paymentAmount))}) is greater than client's active outstanding balance ({formatCurrency(selectedCustomer.outstanding)}). This creates a credit ledger advance.
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Settlement Method</label>
                    <select name="paymentMode" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI / QR Scan</option>
                      <option value="Cash">Cash Ledger</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Transaction ID / Reference</label>
                    <Input name="transactionId" placeholder="e.g. UPI87236A, TXN..." />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Internal Ledger Notes</label>
                    <Input name="referenceNotes" placeholder="e.g. Settle balance for June routes" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 text-white hover:bg-emerald-650" disabled={!selectedCustomerId}>Settle Slipped Receipt</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Printable Receipt Voucher Modal */}
      {printingPayment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 print:p-0 print:bg-white animate-in fade-in duration-150">
          <div className="my-8 bg-white max-w-2xl w-full rounded-2xl shadow-2xl border p-8 print:shadow-none print:border-none print:my-0 flex flex-col relative print:p-0">
            {/* Header toolbar for print action */}
            <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-slate-800 text-sm">Payment Collection Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={triggerBrowserPrint} className="bg-slate-900 text-white hover:bg-slate-800">
                  <Printer className="mr-2 h-4 w-4" /> Print Voucher
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => setPrintingPayment(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Receipt body */}
            <div className="space-y-6 print:block text-xs">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{settings.companyName}</h1>
                  <p className="text-slate-500 text-[10px] mt-0.5">{settings.address}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-md font-black tracking-widest text-emerald-600">RECEIPT VOUCHER</h2>
                  <p className="text-xs font-extrabold text-slate-800 mt-1">{printingPayment.id}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Date: {printingPayment.paymentDate}</p>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Received From:</span>
                  <span className="col-span-2 text-sm font-extrabold text-slate-800">{printingPayment.customerName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Sum of Settle:</span>
                  <span className="col-span-2 text-base font-black text-emerald-600">{formatCurrency(printingPayment.amount)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Settlement Method:</span>
                  <span className="col-span-2 font-semibold text-slate-700">{printingPayment.paymentMode}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Transaction Ref:</span>
                  <span className="col-span-2 text-slate-800 font-medium">{printingPayment.transactionId || 'N/A (Settle Ledger)'}</span>
                </div>
                {printingPayment.referenceNotes && (
                  <div className="grid grid-cols-3 gap-2 border-t pt-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px]">Account Memo:</span>
                    <span className="col-span-2 italic text-slate-500 font-medium">"{printingPayment.referenceNotes}"</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-dashed">
                <div className="text-[9px] text-slate-400">
                  <p>Computer generated payment acknowledgement statement.</p>
                  <p>All receipts are subject to bank clearance conditions.</p>
                </div>
                <div className="text-center w-40">
                  <div className="border-b border-slate-300 h-8"></div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Accounts Officer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
