import React, { useState } from 'react';
import { ServiceRecord } from '@/types/service';
import { Equipment, EquipmentTypeLabels } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ServiceHistoryListProps {
  serviceRecords: ServiceRecord[];
  equipment: Equipment[];
  contactId: number;
  onAddClick: () => void;
  onViewRecord: (record: ServiceRecord) => void;
}

export default function ServiceHistoryList({ 
  serviceRecords, 
  equipment, 
  contactId, 
  onAddClick, 
  onViewRecord 
}: ServiceHistoryListProps) {
  const [filterEquipment, setFilterEquipment] = useState<number | null>(null);
  
  // Filter records by equipment if a filter is selected
  const filteredRecords = filterEquipment 
    ? serviceRecords.filter(r => r.equipment_id === filterEquipment)
    : serviceRecords;
    
  // Sort by date (most recent first)
  const sortedRecords = [...filteredRecords].sort((a, b) => 
    new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
  );
  
  // Find equipment by ID
  const getEquipmentById = (id: number) => {
    return equipment.find(e => e.id === id);
  };
  
  if (serviceRecords.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Service History</h3>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          This customer doesn't have any service history yet. Records will appear here after their first service appointment.
        </p>
        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddClick}>
          Schedule Service
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filter by equipment */}
      <div className="flex flex-wrap gap-2 pb-2">
        <Button 
          variant={filterEquipment === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterEquipment(null)}
          className={filterEquipment === null ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          All Equipment
        </Button>
        
        {equipment.map(equip => (
          <Button
            key={equip.id}
            variant={filterEquipment === equip.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterEquipment(equip.id)}
            className={filterEquipment === equip.id ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {EquipmentTypeLabels[equip.equipment_type as keyof typeof EquipmentTypeLabels] || equip.equipment_type} - {equip.make} {equip.model}
          </Button>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          onClick={onAddClick}
        >
          Schedule Service
        </Button>
      </div>
      
      {/* Service History Timeline */}
      <div className="space-y-4">
        {sortedRecords.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No service records match your filter criteria.</p>
          </div>
        ) : (
          <div className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-7 before:w-px before:bg-gray-200">
            {sortedRecords.map((record) => {
              const equip = getEquipmentById(record.equipment_id);
              return (
                <ServiceRecordCard 
                  key={record.id} 
                  record={record} 
                  equipment={equip}
                  onClick={() => onViewRecord(record)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface ServiceRecordCardProps {
  record: ServiceRecord;
  equipment?: Equipment;
  onClick: () => void;
}

function ServiceRecordCard({ record, equipment, onClick }: ServiceRecordCardProps) {
  const formattedDate = new Date(record.service_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Color based on service type
  const getServiceTypeColor = () => {
    const type = record.service_type.toLowerCase();
    if (type.includes('tune-up') || type.includes('maintenance')) return 'bg-blue-100 text-blue-800';
    if (type.includes('repair')) return 'bg-amber-100 text-amber-800';
    if (type.includes('installation') || type.includes('replacement')) return 'bg-emerald-100 text-emerald-800';
    if (type.includes('emergency')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div 
      className="relative pt-2 pb-4 cursor-pointer group"
      onClick={onClick}
    >
      {/* Timeline dot */}
      <div className="absolute -left-8 -translate-x-1/2 mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-400 group-hover:bg-emerald-500 transition-colors"></div>
      
      <Card className="hover:shadow-md transition-shadow group-hover:border-emerald-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
            <div>
              <span className="text-sm text-gray-500">{formattedDate}</span>
              <h3 className="text-base font-medium text-gray-900 mt-0.5 group-hover:text-emerald-700">
                {equipment && `${equipment.make} ${equipment.model} - `}
                {record.service_type}
              </h3>
            </div>
            <div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor()}`}>
                {record.service_type}
              </span>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-xs text-gray-500">Technician:</span>
              <span className="ml-1 text-sm text-gray-900 font-medium">
                {record.technician || 'Not specified'}
              </span>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-500">Findings:</h4>
              <p className="text-sm text-gray-700 line-clamp-2">
                {record.findings}
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-500">Work Performed:</h4>
              <p className="text-sm text-gray-700 line-clamp-2">
                {record.work_performed}
              </p>
            </div>
            
            {record.parts_used && (
              <div>
                <h4 className="text-xs font-medium text-gray-500">Parts Used:</h4>
                <p className="text-sm text-gray-700 line-clamp-1">
                  {record.parts_used}
                </p>
              </div>
            )}
            
            {record.follow_up_required && (
              <div className="flex items-center mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Follow-up required
                </span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-3">
            <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium group-hover:underline">
              View Complete Record
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}