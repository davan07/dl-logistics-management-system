import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, CreditCard, Receipt, BarChart3, Package2, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Truck, label: 'Shipments (LR)', path: '/shipments' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

export function Sidebar() {
  const { logout } = useData();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Package2 className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">DLLMS</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              L
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">Lokesh</p>
              <p className="text-xs text-muted-foreground mt-0.5">lokesh@dllms.com</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
