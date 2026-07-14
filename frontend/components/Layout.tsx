import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useData } from '../context/DataContext';
import { X, Info, Package, Users, DollarSign, CreditCard } from 'lucide-react';

export function Layout() {
  const { toasts, removeToast } = useData();

  const getToastIcon = (type?: string) => {
    switch (type) {
      case 'shipment':
        return <Package className="h-5 w-5 text-blue-400" />;
      case 'customer':
        return <Users className="h-5 w-5 text-emerald-400" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-amber-400" />;
      case 'expense':
        return <CreditCard className="h-5 w-5 text-rose-400" />;
      default:
        return <Info className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">
          <Outlet />
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-sans">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 w-full bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-slate-800 animate-slide-in-right"
            >
              <div className="p-1 bg-slate-800 rounded-lg shrink-0">
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Event</h4>
                <p className="text-xs text-slate-100 font-medium leading-relaxed mt-0.5 break-words">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

