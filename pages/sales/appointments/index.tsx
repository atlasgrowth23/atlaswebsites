import { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { query } from '../../../lib/db';
import SalesLayout from '../../../components/sales/Layout';
import AppointmentsCalendar from '../../../components/sales/AppointmentsCalendar';
import SalesTabs from '../../../components/sales/SalesTabs';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { format } from 'date-fns';
import { fetchSalesData } from '../../../lib/sales-data';

interface SalesUser {
  id: number;
  name: string;
  email: string;
  territory: string;
  is_admin: boolean;
}

interface Appointment {
  id: number;
  lead_id: number;
  company_name: string;
  appointment_date: string;
  title: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  appointment_type: string;
}

interface AppointmentsProps {
  appointments: Appointment[];
  currentUser: SalesUser;
}

export default function AppointmentsPage({ appointments, currentUser }: AppointmentsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const formattedAppointments = appointments.map(apt => ({
    id: apt.id,
    date: apt.appointment_date,
    title: apt.title || `Meeting with ${apt.company_name}`,
    company_name: apt.company_name,
    type: apt.appointment_type
  }));

  return (
    <SalesLayout currentUser={currentUser}>
      <Head>
        <title>{`Sales Appointments`}</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointments Calendar</h1>
        <p className="text-gray-600">
          View and manage your upcoming appointments with leads.
        </p>
      </div>
      
      <SalesTabs activeTab="appointments" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <AppointmentsCalendar 
              appointments={formattedAppointments}
              onViewAppointment={(id) => {
                const apt = appointments.find(a => a.id === id);
                if (apt) setSelectedAppointment(apt);
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">
              {selectedAppointment ? 'Appointment Details' : 'Upcoming Appointments'}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {selectedAppointment ? (
              <div>
                <h4 className="font-medium">{selectedAppointment.title || `Meeting with ${selectedAppointment.company_name}`}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(selectedAppointment.appointment_date), 'MMMM d, yyyy') + ' (UTC)'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Type: {selectedAppointment.appointment_type || 'Meeting'}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedAppointment.notes || 'No notes added.'}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-sm text-primary hover:text-primary/90"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.length > 0 ? (
                  appointments
                    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                    .slice(0, 5)
                    .map(apt => (
                      <div 
                        key={apt.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedAppointment(apt)}
                      >
                        <p className="font-medium">{apt.title || `Meeting with ${apt.company_name}`}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(apt.appointment_date), 'MMMM d, yyyy') + ' (UTC)'}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming appointments scheduled.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get query parameters
    const { user } = context.query;
    const userParam = typeof user === 'string' ? user : null;
    
    // Fetch all data using our utility function
    const data = await fetchSalesData('appointments');
    
    // If data doesn't have appointments, provide an empty array
    const appointments = Array.isArray(data.appointments) ? data.appointments : [];
    
    // If a specific user was requested, find and use that user
    if (userParam && data.salesUsers) {
      const requestedUser = data.salesUsers.find(u => u.name.toLowerCase() === userParam.toLowerCase());
      if (requestedUser) {
        data.currentUser = requestedUser;
      }
    }
    
    return {
      props: {
        appointments,
        currentUser: data.currentUser
      }
    };
  } catch (error) {
    console.error('Error fetching appointments data:', error);
    
    // Return empty data in case of error
    return {
      props: {
        appointments: [],
        currentUser: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          territory: 'All',
          is_admin: true
        }
      }
    };
  }
}