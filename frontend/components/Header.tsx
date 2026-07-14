import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, Package, Users, DollarSign, CreditCard, Check, Trash2, Clock } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';

export function Header() {
  const { notifications, markAllNotificationsAsRead, clearAllNotifications } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className="h-3.5 w-3.5 text-blue-500" />;
      case 'customer':
        return <Users className="h-3.5 w-3.5 text-emerald-500" />;
      case 'payment':
        return <DollarSign className="h-3.5 w-3.5 text-amber-500" />;
      case 'expense':
        return <CreditCard className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center md:hidden">
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold">DLLMS</span>
      </div>
      
      <div className="hidden md:flex flex-1 items-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search LR, Customers..."
            className="w-full bg-muted/50 pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto relative" ref={dropdownRef}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-slate-600 hover:text-slate-900 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5"
                    title="Mark all as read"
                  >
                    <Check className="h-3 w-3" /> Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAllNotifications()}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-0.5"
                    title="Clear all"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs transition-colors ${
                      notif.read
                        ? 'bg-slate-50/50 border-slate-100 text-slate-600'
                        : 'bg-indigo-50/20 border-indigo-100/50 text-slate-800 font-medium'
                    }`}
                  >
                    <div className="mt-0.5 p-1 bg-white rounded-md shadow-sm border border-slate-100 shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="leading-snug break-words">{notif.message}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatRelativeTime(notif.timestamp)}</span>
                      </div>
                    </div>
                    {!notif.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

