import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from './ThemeProvider';
import AtlasVoiceMic from '../voice/AtlasVoiceMic';
import { 
  UsersIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Contacts', href: '/contacts', icon: UsersIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarIcon, disabled: true },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, disabled: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, disabled: true },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-16 pb-4 bg-white dark:bg-gray-800">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Atlas</h1>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  className={`
                    group flex items-center px-2 py-2 text-base font-medium rounded-md
                    ${item.disabled 
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                      : router.pathname.startsWith(item.href)
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }
                  `}
                  onClick={(e) => {
                    if (item.disabled) e.preventDefault();
                    else setSidebarOpen(false);
                  }}
                  title={item.disabled ? 'Coming Soon' : undefined}
                >
                  <item.icon className="mr-4 h-6 w-6" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={toggleTheme}
              className="touch-target rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <SunIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Atlas</h1>
              <button
                onClick={toggleTheme}
                className="ml-auto touch-target rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <SunIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${item.disabled 
                        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : router.pathname.startsWith(item.href)
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      }
                    `}
                    onClick={(e) => item.disabled && e.preventDefault()}
                    title={item.disabled ? 'Coming Soon' : undefined}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
            <button
              className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden touch-target flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  Atlas
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <nav className="grid grid-cols-4 gap-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.disabled ? '#' : item.href}
              className={`
                flex flex-col items-center justify-center px-2 py-2 text-xs
                ${item.disabled 
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : router.pathname.startsWith(item.href)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
              title={item.disabled ? 'Coming Soon' : undefined}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Atlas Voice Assistant - floating mic */}
      <AtlasVoiceMic 
        onVoiceCommand={(result) => {
          console.log('Atlas Voice Command:', result);
          // Optionally refresh the page or update UI based on the command
          if (result.success && (result.intent === 'create_contact' || result.intent === 'update_contact_field')) {
            // Refresh current page to show changes
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        }}
      />
    </div>
  );
}