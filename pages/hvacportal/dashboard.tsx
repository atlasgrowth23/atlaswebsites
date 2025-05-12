import React from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function Dashboard() {
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p>Welcome to your HVAC Portal Dashboard</p>
    </PortalLayout>
  );
}