import React, { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

interface Technician {
  id: number;
  name: string;
  color: string;
}

interface Appointment {
  id: number;
  technicianId: number;
  contact: string;
  address: string;
  type: 'maintenance' | 'repair' | 'installation' | 'emergency';
  time: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  useEffect(() => {
    // Mock data
    const mockTechnicians: Technician[] = [
      { id: 1, name: 'Mike Johnson', color: '#4f46e5' },
      { id: 2, name: 'Sarah Williams', color: '#0ea5e9' },
      { id: 3, name: 'Dave Roberts', color: '#059669' }
    ];
    
    const mockAppointments: Appointment[] = [
      {
        id: 101,
        technicianId: 1,
        contact: 'John Smith',
        address: '123 Main St, Springfield, IL',
        type: 'maintenance',
        time: '2025-05-14T09:00:00',
        duration: 60,
        status: 'completed',
        notes: 'Annual maintenance check'
      },
      {
        id: 102,
        technicianId: 1,
        contact: 'Sarah Johnson',
        address: '456 Oak Ave, Springfield, IL',
        type: 'repair',
        time: '2025-05-14T11:00:00',
        duration: 90,
        status: 'in-progress',
        notes: 'AC not cooling properly'
      },
      {
        id: 103,
        technicianId: 2,
        contact: 'Michael Brown',
        address: '789 Pine St, Springfield, IL',
        type: 'emergency',
        time: '2025-05-14T10:30:00',
        duration: 120,
        status: 'completed',
        notes: 'No heat'
      },
      {
        id: 104,
        technicianId: 3,
        contact: 'Emily Davis',
        address: '321 Maple Dr, Springfield, IL',
        type: 'installation',
        time: '2025-05-14T14:00:00',
        duration: 180,
        status: 'scheduled',
        notes: 'New thermostat installation'
      }
    ];
    
    setTechnicians(mockTechnicians);
    setAppointments(mockAppointments);
  }, []);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAppointmentStyle = (appointment: Appointment) => {
    const tech = technicians.find(t => t.id === appointment.technicianId);
    const baseColor = tech?.color || '#4f46e5';
    
    let bgColor = baseColor;
    let textColor = 'white';
    let opacity = '1';
    
    switch (appointment.status) {
      case 'completed':
        opacity = '0.5';
        break;
      case 'in-progress':
        bgColor = '#f59e0b';
        break;
      case 'cancelled':
        bgColor = '#6b7280';
        opacity = '0.5';
        break;
    }
    
    if (appointment.type === 'emergency') {
      bgColor = '#ef4444';
    }
    
    return {
      backgroundColor: bgColor,
      color: textColor,
      opacity
    };
  };

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'repair':
        return '🛠️';
      case 'installation':
        return '📦';
      case 'emergency':
        return '🚨';
      default:
        return '📅';
    }
  };

  return (
    <PortalLayout title="Schedule" activeTab="schedule">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handlePrevDay}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              &lt;
            </button>
            
            <h2 className="text-lg font-bold">{formatDate(currentDate)}</h2>
            
            <button 
              onClick={handleNextDay}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              &gt;
            </button>
            
            <button 
              onClick={handleTodayClick}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md"
            >
              Today
            </button>
          </div>
          
          <button className="bg-blue-600 text-white px-3 py-1 rounded">
            + New Appointment
          </button>
        </div>
        
        <div className="flex h-[calc(100vh-16rem)]">
          {/* Calendar Grid */}
          <div className="flex-grow overflow-y-auto p-4">
            <div className="flex border-b">
              {/* Time column */}
              <div className="w-20 pr-2 text-right text-sm text-gray-500">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-20 border-t pt-1">
                    {i + 8}:00
                  </div>
                ))}
              </div>
              
              {/* Technician columns */}
              <div className="flex-grow grid" style={{ gridTemplateColumns: `repeat(${technicians.length}, 1fr)` }}>
                {technicians.map(tech => (
                  <div key={tech.id} className="border-l">
                    <div className="px-2 py-1 font-medium text-sm text-center border-b bg-gray-50">
                      {tech.name}
                      <span 
                        className="ml-2 inline-block w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tech.color }}
                      />
                    </div>
                    
                    <div className="relative h-[calc(12*5rem)]">
                      {/* Time grid lines */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="absolute w-full border-t h-20" style={{ top: `${i * 5}rem` }}></div>
                      ))}
                      
                      {/* Appointments for this technician */}
                      {appointments
                        .filter(apt => apt.technicianId === tech.id)
                        .map(appointment => {
                          const date = new Date(appointment.time);
                          const hours = date.getHours();
                          const minutes = date.getMinutes();
                          const top = ((hours - 8) * 60 + minutes) * (5/60); // 5rem per hour
                          const height = appointment.duration * (5/60); // 5rem per hour
                          
                          return (
                            <div
                              key={appointment.id}
                              className="absolute left-1 right-1 rounded p-2 cursor-pointer"
                              style={{
                                top: `${top}rem`,
                                height: `${height}rem`,
                                ...getAppointmentStyle(appointment)
                              }}
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-bold">{formatTime(appointment.time)}</span>
                                <span>{getAppointmentIcon(appointment.type)}</span>
                              </div>
                              <div className="text-sm font-medium truncate">{appointment.contact}</div>
                              <div className="text-xs truncate">{appointment.address}</div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Appointment Details */}
          {selectedAppointment && (
            <div className="w-72 border-l p-4 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold">{selectedAppointment.contact}</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(selectedAppointment.time)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedAppointment.duration} minutes</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedAppointment.address}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="font-medium capitalize">{selectedAppointment.type}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedAppointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    selectedAppointment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedAppointment.status.replace('-', ' ')}
                  </span>
                </div>
                
                {selectedAppointment.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{selectedAppointment.notes}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <button className="w-full bg-blue-600 text-white py-2 rounded mb-2">
                    Update Status
                  </button>
                  <button className="w-full border border-gray-300 py-2 rounded">
                    Edit Appointment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}