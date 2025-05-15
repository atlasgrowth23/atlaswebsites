import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceHistory } from '@/types/contact';

interface ContactServiceHistoryProps {
  serviceHistory: ServiceHistory[];
  formatDate: (date: string) => string;
}

export function ContactServiceHistory({ serviceHistory, formatDate }: ContactServiceHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900">Service History</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Service
        </Button>
      </div>
      
      {serviceHistory.map(service => (
        <div key={service.id} className="border rounded-md p-4">
          <div className="flex justify-between mb-2">
            <h4 className="font-medium text-gray-900">{service.type}</h4>
            <span className="text-sm text-gray-500">{formatDate(service.date)}</span>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">{service.description}</p>
          
          <div className="flex justify-between text-sm">
            <div className="text-gray-500">
              Tech: <span className="text-gray-900">{service.technician}</span>
            </div>
            <div className="font-medium text-gray-900">{service.cost}</div>
          </div>
        </div>
      ))}
    </div>
  );
}