import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface AppointmentEvent {
  id: number;
  date: string;
  title: string;
  company_name: string;
  type: string;
}

interface AppointmentsCalendarProps {
  appointments: AppointmentEvent[];
  onSelectDate?: (date: Date) => void;
  onViewAppointment?: (id: number) => void;
}

export default function AppointmentsCalendar({ appointments, onSelectDate, onViewAppointment }: AppointmentsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = 'EEEEEE';
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find appointments for this day
        const dayAppointments = appointments.filter(appt => {
          const apptDate = new Date(appt.date);
          return isSameDay(apptDate, cloneDay);
        });
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[80px] p-1 border border-gray-200 ${
              !isSameMonth(day, monthStart)
                ? 'text-gray-400 bg-gray-50'
                : isSameDay(day, selectedDate)
                ? 'bg-blue-50 border-blue-200'
                : ''
            }`}
            onClick={() => {
              setSelectedDate(cloneDay);
              onSelectDate && onSelectDate(cloneDay);
            }}
          >
            <div className="text-right text-sm">{formattedDate}</div>
            <div className="mt-1 overflow-y-auto max-h-[60px]">
              {dayAppointments.map(appointment => (
                <div 
                  key={appointment.id}
                  className="text-xs p-1 my-1 rounded truncate cursor-pointer bg-blue-100 text-blue-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAppointment && onViewAppointment(appointment.id);
                  }}
                >
                  {appointment.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}