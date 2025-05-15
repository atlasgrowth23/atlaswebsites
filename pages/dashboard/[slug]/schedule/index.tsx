import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Calendar, Plus } from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';

export default function SchedulePage() {
  const router = useRouter();
  const { slug } = router.query;
  
  return (
    <MainLayout title="Schedule">
      <Head>
        <title>Schedule - HVAC Pro</title>
        <meta name="description" content="Manage your service schedule" />
      </Head>
      
      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage service calls and appointments
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
        
        {/* Schedule placeholder */}
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Management</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            This feature will allow you to manage appointments, technician schedules, and service calls.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Job
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}