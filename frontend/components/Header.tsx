import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export function Header() {
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

      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>
      </div>
    </header>
  );
}
