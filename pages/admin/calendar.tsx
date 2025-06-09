import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Appointment {
  id: string;
  lead_id: string;
  company_name: string;
  owner_name: string;
  owner_email: string;
  phone_number?: string;
  appointment_date: string;
  appointment_time: string;
  created_by: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

export default function Calendar() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    companyName: '',
    ownerName: '',
    ownerEmail: '',
    phoneNumber: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '14:00',
    createdBy: 'nick',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`/api/calendar/appointments?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Book appointment
      const response = await fetch('/api/calendar/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Send confirmation email
        await fetch('/api/send-appointment-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerEmail: bookingForm.ownerEmail,
            ownerName: bookingForm.ownerName,
            companyName: bookingForm.companyName,
            appointmentDate: new Date(bookingForm.appointmentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
            }),
            appointmentTime: new Date(`1970-01-01T${bookingForm.appointmentTime}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            phoneNumber: bookingForm.phoneNumber,
            setBy: bookingForm.createdBy
          })
        });

        // Reset form and refresh
        setBookingForm({
          companyName: '',
          ownerName: '',
          ownerEmail: '',
          phoneNumber: '',
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '14:00',
          createdBy: 'nick',
          notes: ''
        });
        setShowBookingForm(false);
        fetchAppointments();
        
        alert('✅ Appointment booked and confirmation email sent!');
      } else {
        const error = await response.json();
        alert(`❌ Error booking appointment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('❌ Failed to book appointment');
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeSlots.push({ value: timeString, label: displayTime });
    }
  }

  const getAppointmentsForTime = (time: string) => {
    return appointments.filter(apt => apt.appointment_time === time);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atlas Growth Calendar</h1>
            <p className="text-gray-600">Manage consultation appointments</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/admin/pipeline')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back to Pipeline
            </button>
            <button
              onClick={() => setShowBookingForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Book Appointment
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-lg font-medium text-gray-900 mt-2">
            {formatDate(selectedDate)}
          </p>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <h2 className="text-xl font-semibold">Daily Schedule</h2>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading appointments...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {timeSlots.map(slot => {
                  const slotAppointments = getAppointmentsForTime(slot.value);
                  return (
                    <div key={slot.value} className="flex items-center border-b border-gray-100 py-2">
                      <div className="w-24 text-sm font-medium text-gray-600">
                        {slot.label}
                      </div>
                      <div className="flex-1 ml-4">
                        {slotAppointments.length > 0 ? (
                          <div className="space-y-2">
                            {slotAppointments.map(apt => (
                              <div key={apt.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{apt.company_name}</h4>
                                    <p className="text-sm text-gray-600">{apt.owner_name} • {apt.owner_email}</p>
                                    {apt.phone_number && (
                                      <p className="text-sm text-gray-600">📞 {apt.phone_number}</p>
                                    )}
                                    <p className="text-xs text-blue-600 mt-1">Booked by {apt.created_by}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      apt.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                      apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {apt.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">Available</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Book New Appointment</h2>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.companyName}
                      onChange={(e) => setBookingForm({...bookingForm, companyName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.ownerName}
                      onChange={(e) => setBookingForm({...bookingForm, ownerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={bookingForm.ownerEmail}
                      onChange={(e) => setBookingForm({...bookingForm, ownerEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={bookingForm.phoneNumber}
                      onChange={(e) => setBookingForm({...bookingForm, phoneNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingForm.appointmentDate}
                      onChange={(e) => setBookingForm({...bookingForm, appointmentDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <select
                      required
                      value={bookingForm.appointmentTime}
                      onChange={(e) => setBookingForm({...bookingForm, appointmentTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {timeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booked By *
                    </label>
                    <select
                      required
                      value={bookingForm.createdBy}
                      onChange={(e) => setBookingForm({...bookingForm, createdBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="nick">Nick</option>
                      <option value="jared">Jared</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Book & Send Email
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}