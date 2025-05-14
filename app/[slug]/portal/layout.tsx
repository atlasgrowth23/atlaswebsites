import { ReactNode } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../../components/ui/sidebar';
import { queryOne } from '../../../lib/db';
import { getBrandColor, getAccentColor } from '../../../lib/getFrame';
import '../../../styles/tokens.css';

// Define the props for this component
interface PortalLayoutProps {
  children: ReactNode;
  params: {
    slug: string;
  };
}

async function getCompanyData(slug: string) {
  const company = await queryOne('SELECT * FROM companies WHERE slug = $1', [slug]);
  return company;
}

export default async function PortalLayout({
  children,
  params,
}: PortalLayoutProps) {
  const slug = params?.slug || '';
  const company = await getCompanyData(slug);
  
  if (!company) {
    return <div className="p-10">Company not found</div>;
  }
  
  // Extract colors with fallbacks
  const brandColor = getBrandColor(company);
  const accentColor = getAccentColor(company);
  
  // Generate CSS variables for the company colors
  const cssVariables = {
    '--color-primary': hexToHsl(brandColor),
    '--color-accent': hexToHsl(accentColor),
  };
  
  return (
    <div
      className="flex h-screen bg-gray-50 dark:bg-gray-900"
      style={cssVariables as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary">{company.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Portal</p>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href={`/${params.slug}/portal/messages`} 
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                Messages
              </Link>
            </li>
            <li>
              <Link 
                href={`/${params.slug}/portal/contacts`} 
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Contacts
              </Link>
            </li>
            <li>
              <Link 
                href={`/${params.slug}/portal/schedule`} 
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Schedule
              </Link>
            </li>
            <li>
              <Link 
                href={`/${params.slug}/portal/settings`} 
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              HVAC Portal
            </h2>
          </div>
        </header>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper function to convert hex to HSL for CSS variables
function hexToHsl(hex: string): string {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find the min and max values to calculate saturation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  // Calculate HSL values
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    
    h /= 6;
  }
  
  // Convert to degrees, percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const l2 = Math.round(l * 100);
  
  return `${h} ${s}% ${l2}%`;
}