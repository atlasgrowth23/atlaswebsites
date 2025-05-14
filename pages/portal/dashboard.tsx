import React from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

export default function PortalDashboard() {
  return (
    <PortalLayout title="Dashboard" activeTab="dashboard">
      <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dashboard Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">New Messages</h3>
          <p className="text-3xl font-bold text-blue-600">4</p>
          <a href="/portal/messages" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
            View all messages →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Today's Appointments</h3>
          <p className="text-3xl font-bold text-blue-600">2</p>
          <a href="/portal/schedule" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
            View schedule →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Recent Leads</h3>
          <p className="text-3xl font-bold text-blue-600">7</p>
          <a href="/portal/contacts" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
            View all contacts →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Pending Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <a href="/portal/schedule" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
            View all jobs →
          </a>
        </div>
      </div>
    </PortalLayout>
  );
}