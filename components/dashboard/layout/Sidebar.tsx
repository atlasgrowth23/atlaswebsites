import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Calendar, 
  Settings,
  BarChart,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const router = useRouter();
  
  // Navigation item groups
  const mainNavItems = [
    { 
      name: 'Overview', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true
    },
    { 
      name: 'Messages', 
      href: '/dashboard/messages', 
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 3
    },
    { 
      name: 'Contacts', 
      href: '/dashboard/contacts', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      name: 'Schedule', 
      href: '/dashboard/schedule', 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      name: 'Reports', 
      href: '/dashboard/reports', 
      icon: <BarChart className="h-5 w-5" /> 
    },
    { 
      name: 'Invoices', 
      href: '/dashboard/invoices', 
      icon: <FileText className="h-5 w-5" /> 
    }
  ];
  
  const secondaryNavItems = [
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
    { 
      name: 'Help & Support', 
      href: '/dashboard/support', 
      icon: <HelpCircle className="h-5 w-5" /> 
    }
  ];
  
  // Check if a nav item is active
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };
  
  return (
    <div className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col">
      {/* Logo */}
      <div className="h-16 border-b border-gray-200 flex items-center px-6">
        <Link href="/dashboard" className="flex items-center">
          <div className="bg-blue-600 text-white p-2 rounded-md">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-900">HVAC Pro</span>
        </Link>
      </div>
      
      {/* Main Navigation */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
        <nav className="px-4 space-y-1">
          {/* Main menu items */}
          <div className="mb-6">
            {mainNavItems.map((item) => (
              <Button
                key={item.name}
                variant={isActive(item.href, item.exact) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1 relative",
                  isActive(item.href, item.exact) 
                    ? "bg-gray-100 font-medium" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </div>
                
                {item.badge && (
                  <span className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {item.badge}
                  </span>
                )}
              </Button>
            ))}
          </div>
          
          {/* Secondary menu items */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <p className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Support
            </p>
            
            {secondaryNavItems.map((item) => (
              <Button
                key={item.name}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isActive(item.href) 
                    ? "bg-gray-100 font-medium" 
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => router.push(item.href)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Button>
            ))}
          </div>
        </nav>
        
        {/* User Profile Section */}
        <div className="px-4 mt-6">
          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="outline"
              className="w-full justify-start text-gray-700"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
          
          <div className="mt-4 flex items-center border rounded-lg p-3 bg-gray-50">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                A
              </div>
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@example.com</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-gray-500">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;