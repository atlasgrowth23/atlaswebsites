import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Equipment } from '@/types/contact';

interface ContactEquipmentProps {
  equipment: Equipment[];
  formatDate: (date: string) => string;
}

export function ContactEquipment({ equipment, formatDate }: ContactEquipmentProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900">Equipment</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Equipment
        </Button>
      </div>
      
      {equipment.map(item => (
        <div key={item.id} className="border rounded-md p-4">
          <div className="flex justify-between">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <Badge variant="outline" className={
              item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
              item.status === 'maintenance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              item.status === 'repair_needed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }>
              {item.status === 'repair_needed' ? 'Needs Repair' : 
               item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-500">Model</div>
              <div className="text-gray-900">{item.model}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Serial</div>
              <div className="text-gray-900">{item.serial}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Installed</div>
              <div className="text-gray-900">{formatDate(item.installed)}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Last Service</div>
              <div className="text-gray-900">{formatDate(item.last_service)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}