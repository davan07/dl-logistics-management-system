import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Printer, Trash2, X, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { Shipment } from '../types';

export function Shipments() {
  const { shipments, customers, settings, addShipment, updateShipmentStatus, deleteShipment } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printingShipment, setPrintingShipment] = useState<Shipment | null>(null);

  // Filter customers that are Active to choose as consignor
  const activeCustomers = useMemo(() => {
    return customers.filter(c => c.status === 'Active');
  }, [customers]);

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      const matchesSearch = 
        s.lrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.consignorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.consigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchQuery, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateLRSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addShipment({
      lrNumber: formData.get('lrNumber') as string,
      consignorName: formData.get('consignorName') as string,
      consigneeName: formData.get('consigneeName') as string,
      origin: formData.get('origin') as string,
      destination: formData.get('destination') as string,
      freight: Number(formData.get('freight')),
      status: 'Booked',
    });
    
    setIsAddModalOpen(false);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Shipments & Lorry Receipts</h2>
          <p className="text-slate-500 font-medium">Issue cargo LRs, track transits, and generate official transit bills.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary hover:bg-primary/95 text-white">
          <Plus className="mr-2 h-4 w-4" /> Create LR
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg font-bold text-slate-800">Booking Ledger</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Search LR, Consignor, Route..."
                  className="pl-9 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="All">All Statuses</option>
                <option value="Booked">Booked</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LR Number & Date</TableHead>
                <TableHead>Consignor (Client)</TableHead>
                <TableHead>Consignee (Recipient)</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Freight</TableHead>
                <TableHead>Transit Status</TableHead>
                <TableHead className="w-[150px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                    No shipments found. Book a cargo receipt to start tracking.
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-800">
                      <div className="text-blue-600 font-bold">{shipment.lrNumber}</div>
                      <div className="text-xs text-slate-400 font-normal">{shipment.bookingDate}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">{shipment.consignorName}</TableCell>
                    <TableCell className="text-slate-600">{shipment.consigneeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600 font-medium">
                        <span>{shipment.origin}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span>{shipment.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">{formatCurrency(shipment.freight)}</TableCell>
                    <TableCell>
                      <select
                        value={shipment.status}
                        onChange={(e) => updateShipmentStatus(shipment.id, e.target.value as Shipment['status'])}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 focus:ring-2 focus:ring-primary cursor-pointer ${
                          shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50" onClick={() => setPrintingShipment(shipment)} title="Print Lorry Receipt">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => deleteShipment(shipment.id)} title="Delete Booking">
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

      {/* Create Lorry Receipt Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <Card className="w-full max-w-lg shadow-2xl bg-white border animate-in zoom-in-95 duration-150">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-bold text-slate-800">Create Lorry Receipt (LR)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {activeCustomers.length === 0 ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-sm text-slate-500">You must have active customers in the directory to issue a Lorry Receipt.</p>
                  <Button type="button" onClick={() => setIsAddModalOpen(false)}>Close</Button>
                </div>
              ) : (
                <form onSubmit={handleCreateLRSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">LR Number</label>
                      <Input name="lrNumber" required placeholder="e.g. LR-2026-045" pattern="^[a-zA-Z0-9\-]+$" title="Only alphanumeric characters and hyphens allowed" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Consignor (Client)</label>
                      <select name="consignorName" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {activeCustomers.map(c => (
                          <option key={c.id} value={c.companyName}>{c.companyName} ({c.id})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Consignee Name</label>
                      <Input name="consigneeName" required placeholder="e.g. Retail Distributors Ltd" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">Origin City</label>
                      <Input name="origin" required placeholder="Mumbai" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">Destination City</label>
                      <Input name="destination" required placeholder="Bangalore" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-600 uppercase">Freight Charges ({settings.currency})</label>
                      <Input name="freight" type="number" required defaultValue="35000" min="1" />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-primary text-white">Issue LR</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Printable Invoice Modal (Official Lorry Receipt Copy) */}
      {printingShipment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 print:p-0 print:bg-white animate-in fade-in duration-150">
          <div className="my-8 bg-white max-w-3xl w-full rounded-2xl shadow-2xl border p-8 print:shadow-none print:border-none print:my-0 flex flex-col relative print:p-0">
            {/* Header toolbar for print action */}
            <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-bold text-slate-800 text-sm">Official Consignment Bill</span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={triggerBrowserPrint} className="bg-slate-900 text-white hover:bg-slate-800">
                  <Printer className="mr-2 h-4 w-4" /> Print Document
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100" onClick={() => setPrintingShipment(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Document body - styled exactly like a cargo invoice receipt */}
            <div className="space-y-6 print:block">
              {/* Lorry Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{settings.companyName}</h1>
                  <p className="text-xs text-slate-500 font-semibold max-w-sm mt-1">{settings.address}</p>
                  <p className="text-xs text-slate-400 font-medium">GSTIN: {settings.taxNumber}</p>
                </div>
                <div className="text-right border-l-2 pl-4 border-slate-200">
                  <h2 className="text-lg font-black tracking-widest text-slate-900">LORRY RECEIPT</h2>
                  <p className="text-sm font-extrabold text-blue-600 mt-1">{printingShipment.lrNumber}</p>
                  <p className="text-xs font-semibold text-slate-500">Date: {printingShipment.bookingDate}</p>
                </div>
              </div>

              {/* Transit Details Grid */}
              <div className="grid grid-cols-2 border border-slate-300 rounded-lg text-xs divide-x divide-y divide-slate-300">
                <div className="p-3">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Consignor (Booked By)</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{printingShipment.consignorName}</p>
                  <p className="text-slate-500 mt-1">Verified Client Directory Account</p>
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Consignee (Deliver To)</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{printingShipment.consigneeName}</p>
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Dispatch From</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{printingShipment.origin}</p>
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Cargo Destination</p>
                  <p className="font-extrabold text-slate-800 text-sm mt-0.5">{printingShipment.destination}</p>
                </div>
              </div>

              {/* Package Particulars */}
              <table className="w-full text-xs border border-slate-300 rounded-lg divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr className="text-left font-bold text-slate-600 divide-x divide-slate-300">
                    <th className="p-3">Description of Goods</th>
                    <th className="p-3 text-center">Qty / Packages</th>
                    <th className="p-3 text-right">Freight Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr className="divide-x divide-slate-300">
                    <td className="p-3 font-semibold text-slate-800">
                      Industrial goods consignment from {printingShipment.origin} to {printingShipment.destination}
                      <p className="text-[10px] text-slate-400 mt-0.5">Booking Status: {printingShipment.status}</p>
                    </td>
                    <td className="p-3 text-center text-slate-800">1 Full Truck Load (FTL)</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">{formatCurrency(printingShipment.freight)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold divide-x divide-slate-300">
                    <td colSpan={2} className="p-3 text-right text-slate-600">Total Freight (Subtotal)</td>
                    <td className="p-3 text-right text-slate-900 font-black">{formatCurrency(printingShipment.freight)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Conditions & Signatures */}
              <div className="grid grid-cols-2 pt-6 text-[10px] gap-6 text-slate-500 border-t border-dashed">
                <div>
                  <p className="font-bold text-slate-700">TERMS & CONDITIONS</p>
                  <ul className="list-disc pl-3 mt-1 space-y-1">
                    <li>The carrier is not responsible for any delay due to force majeure.</li>
                    <li>Insurance of goods is the sole responsibility of the consignor.</li>
                    <li>All disputes are subject to local judicial jurisdiction.</li>
                  </ul>
                </div>
                <div className="flex flex-col justify-end items-end h-full">
                  <div className="border-b border-slate-400 w-48 text-center pb-1 mb-1 font-semibold text-slate-800">
                    {settings.companyName}
                  </div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
