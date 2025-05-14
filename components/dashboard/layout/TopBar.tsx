import React from 'react';
import { useRouter } from 'next/router';
import { 
  Menu, 
  X, 
  Bell, 
  Search,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  title?: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, mobileMenuOpen, setMobileMenuOpen }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
            
            <span className="ml-2 text-lg font-semibold">
              {title || 'Dashboard'}
            </span>
          </div>
          
          {/* Search */}
          <div className="max-w-md w-full hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input 
                type="search" 
                placeholder="Search..." 
                className="pl-10 py-1.5 h-9"
              />
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Create Button */}
            <Button size="sm" className="hidden md:flex">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
            
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-gray-500 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 gap-2">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <div className="bg-gray-100 h-8 w-8 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      A
                    </div>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">Admin User</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Company</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;