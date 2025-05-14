import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Calendar, 
  Bell, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5 mr-2" /> },
    { name: 'Messages', href: '/dashboard/messages', icon: <MessageSquare className="h-5 w-5 mr-2" /> },
    { name: 'Contacts', href: '/dashboard/contacts', icon: <Users className="h-5 w-5 mr-2" /> },
    { name: 'Schedule', href: '/dashboard/schedule', icon: <Calendar className="h-5 w-5 mr-2" /> },
  ];
  
  // Determine if nav item is active
  const isActive = (path: string) => {
    return router.pathname === path || 
      (path !== '/dashboard' && router.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="bg-blue-600 text-white p-2 rounded-md mr-2">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="text-xl font-semibold text-gray-900">HVAC Dashboard</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 gap-1",
                    isActive(item.href) 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  {item.icon}
                  {item.name}
                </Button>
              ))}
            </nav>
            
            {/* User and Notifications */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        A
                      </div>
                    </Avatar>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-600">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? 
                    <X className="h-6 w-6" /> : 
                    <Menu className="h-6 w-6" />
                  }
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-2">
              <nav className="flex flex-col space-y-1 px-2 pb-3 pt-2">
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={cn(
                      "justify-start",
                      isActive(item.href) 
                        ? "bg-gray-900 text-white" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    {item.name}
                  </Button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex-1">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {title || 'Dashboard'}
            </h1>
          </div>
          
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}