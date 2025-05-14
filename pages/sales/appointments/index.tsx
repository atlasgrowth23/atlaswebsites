import { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { query } from '../../../lib/db';
import SalesLayout from '../../../components/sales/Layout';
import AppointmentsCalendar from '../../../components/sales/AppointmentsCalendar';
import { format } from 'date-fns';

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
        <title>Sales Appointments</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointments Calendar</h1>
        <p className="text-gray-600">
          View and manage your upcoming appointments with leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AppointmentsCalendar 
            appointments={formattedAppointments}
            onViewAppointment={(id) => {
              const apt = appointments.find(a => a.id === id);
              if (apt) setSelectedAppointment(apt);
            }}
          />
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedAppointment ? 'Appointment Details' : 'Upcoming Appointments'}
            </h3>
            
            {selectedAppointment ? (
              <div>
                <h4 className="font-medium">{selectedAppointment.title || `Meeting with ${selectedAppointment.company_name}`}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(selectedAppointment.appointment_date), 'MMMM d, yyyy h:mm a')}
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
                    className="text-sm text-gray-600 hover:text-gray-900"
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
                          {format(new Date(apt.appointment_date), 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No upcoming appointments scheduled.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get sales users
    const usersResult = await query(
      'SELECT id, name, email, territory, is_admin FROM sales_users ORDER BY name'
    );
    const salesUsers = usersResult.rows;
    
    // Determine current user (default to admin)
    const currentUser = salesUsers.find(u => u.is_admin) || salesUsers[0];
    
    // Check if the table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_appointments'
      );
    `);
    
    let appointments = [];
    
    // Only try to query if the table exists
    if (tableExists.rows[0].exists) {
      const appointmentsResult = await query(`
        SELECT 
          a.id,
          a.lead_id,
          c.name as company_name,
          a.appointment_date,
          a.title,
          a.notes,
          a.user_id as created_by,
          su.name as created_by_name,
          a.location as appointment_type
        FROM 
          sales_appointments a
        JOIN 
          sales_leads l ON a.lead_id = l.id
        JOIN 
          companies c ON l.company_id = c.id
        JOIN
          sales_users su ON a.user_id = su.id
        WHERE
          a.appointment_date >= NOW()
        ORDER BY 
          a.appointment_date ASC
      `);
      
      // Convert date strings to ISO strings to make them serializable
      appointments = appointmentsResult.rows.map(appointment => ({
        ...appointment,
        appointment_date: new Date(appointment.appointment_date).toISOString()
      }));
    }
    
    return {
      props: {
        appointments,
        currentUser
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