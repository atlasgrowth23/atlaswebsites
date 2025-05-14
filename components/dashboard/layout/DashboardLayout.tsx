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
  ChevronDown,
  Settings,
  BarChart,
  FileText,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar currentPath={router.pathname} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* TopBar */}
        <TopBar 
          title={title} 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen} 
        />
        
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <nav className="flex flex-col space-y-1 px-4 pb-3 pt-2">
              <Button
                variant={router.pathname === '/dashboard' ? "default" : "ghost"}
                className="justify-start mb-1"
                onClick={() => {
                  router.push('/dashboard');
                  setMobileMenuOpen(false);
                }}
              >
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Overview
              </Button>
              
              <Button
                variant={router.pathname.includes('/dashboard/messages') ? "default" : "ghost"}
                className="justify-start mb-1"
                onClick={() => {
                  router.push('/dashboard/messages');
                  setMobileMenuOpen(false);
                }}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Messages
              </Button>
              
              <Button
                variant={router.pathname.includes('/dashboard/contacts') ? "default" : "ghost"}
                className="justify-start mb-1"
                onClick={() => {
                  router.push('/dashboard/contacts');
                  setMobileMenuOpen(false);
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                Contacts
              </Button>
              
              <Button
                variant={router.pathname.includes('/dashboard/schedule') ? "default" : "ghost"}
                className="justify-start mb-1"
                onClick={() => {
                  router.push('/dashboard/schedule');
                  setMobileMenuOpen(false);
                }}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Schedule
              </Button>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <Button
                  variant="ghost"
                  className="justify-start mb-1"
                  onClick={() => {
                    router.push('/dashboard/settings');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Button>
                
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Help & Support
                </Button>
              </div>
            </nav>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
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
    </div>
  );
}