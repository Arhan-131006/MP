'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, LogOut, Settings, Users, BarChart3, CreditCard, Briefcase, Calendar } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Users, label: 'Users', href: '/dashboard/admin/users' },
    { icon: CreditCard, label: 'Payments', href: '/dashboard/admin/payments' },
    { icon: Settings, label: 'Settings', href: '/dashboard/admin/settings' },
  ];

  const managementItems = [
    { icon: Briefcase, label: 'Job Management', href: '/features/job-management' },
    { icon: Users, label: 'Team Management', href: '/features/team-management' },
    { icon: Calendar, label: 'Scheduling', href: '/features/scheduling' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary text-primary-foreground transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-primary-foreground/20">
          {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-primary-foreground/10 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          {/* Separator */}
          {sidebarOpen && (
            <div className="my-4 border-t border-primary-foreground/20"></div>
          )}

          {/* Management Title */}
          {sidebarOpen && (
            <p className="px-4 py-2 text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider">
              Management
            </p>
          )}

          {/* Management Items */}
          {managementItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-foreground/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings size={20} />
                {sidebarOpen && <span className="ml-2">Account</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-background border-b border-border p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Industry Management Platform</h2>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Admin Account</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
