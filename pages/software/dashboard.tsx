import React from 'react';
import Layout from '@/components/software/Layout';
import ProtectedRoute from '@/components/software/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout title="Dashboard">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Dashboard Summary Cards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">New Messages</h3>
            <p className="text-3xl font-bold text-blue-600">4</p>
            <a href="/software/messages" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all messages →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Today's Appointments</h3>
            <p className="text-3xl font-bold text-blue-600">2</p>
            <a href="/software/schedule" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View schedule →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Recent Leads</h3>
            <p className="text-3xl font-bold text-blue-600">7</p>
            <a href="/software/contacts" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all contacts →
            </a>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Pending Jobs</h3>
            <p className="text-3xl font-bold text-blue-600">3</p>
            <a href="/software/schedule" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all jobs →
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 pb-4 border-b">
                <div className="bg-blue-100 text-blue-600 p-2 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">New message from John Smith</p>
                  <p className="text-sm text-gray-500">Today at 10:45 AM</p>
                  <p className="text-sm mt-1">My AC stopped working suddenly...</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 pb-4 border-b">
                <div className="bg-green-100 text-green-600 p-2 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Job completed</p>
                  <p className="text-sm text-gray-500">Today at 9:30 AM</p>
                  <p className="text-sm mt-1">Furnace repair at 123 Main St</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 pb-4 border-b">
                <div className="bg-yellow-100 text-yellow-600 p-2 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">New appointment scheduled</p>
                  <p className="text-sm text-gray-500">Yesterday at 3:15 PM</p>
                  <p className="text-sm mt-1">AC maintenance at 456 Oak Ave</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 text-purple-600 p-2 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">New lead received</p>
                  <p className="text-sm text-gray-500">Yesterday at 11:20 AM</p>
                  <p className="text-sm mt-1">Sarah Johnson (Quote Request)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4">Today's Schedule</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <p className="font-medium">9:00 AM - AC Repair</p>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">In Progress</span>
                </div>
                <p className="text-sm text-gray-600">John Smith - 123 Main St</p>
                <p className="text-sm text-gray-500 mt-1">Tech: Mike Johnson</p>
              </div>
              
              <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded opacity-60">
                <div className="flex justify-between mb-1">
                  <p className="font-medium">10:30 AM - Maintenance</p>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>
                </div>
                <p className="text-sm text-gray-600">Emily Davis - 789 Pine St</p>
                <p className="text-sm text-gray-500 mt-1">Tech: Sarah Williams</p>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <p className="font-medium">2:00 PM - New Installation</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Scheduled</span>
                </div>
                <p className="text-sm text-gray-600">Michael Brown - 456 Oak Ave</p>
                <p className="text-sm text-gray-500 mt-1">Tech: Dave Roberts</p>
              </div>
              
              <div className="mt-4 text-center">
                <a href="/software/schedule" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  View Full Schedule
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}