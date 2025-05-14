import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SalesTabsProps {
  activeTab: string;
}

export default function SalesTabs({ activeTab }: SalesTabsProps) {
  const router = useRouter();

  // Define tab routes
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/sales' },
    { id: 'leads', label: 'Leads', path: '/sales/leads' },
    { id: 'appointments', label: 'Appointments', path: '/sales/appointments' },
    { id: 'reports', label: 'Reports', path: '/sales/reports' },
  ];

  return (
    <div className="mb-6">
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="w-full mb-6">
          {tabs.map((tab) => (
            <TabsTrigger 
              value={tab.id} 
              key={tab.id}
              className={`${activeTab === tab.id ? 'bg-primary/10' : ''}`}
              onClick={() => router.push(tab.path)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}