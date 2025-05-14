import React, { useState } from 'react';
import { Equipment, EquipmentTypeLabels } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EquipmentListProps {
  equipment: Equipment[];
  contactId: number;
  onAddClick: () => void;
  onViewEquipment: (equipment: Equipment) => void;
}

export default function EquipmentList({ equipment, contactId, onAddClick, onViewEquipment }: EquipmentListProps) {
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Get unique equipment types for filters
  const equipmentTypes = Array.from(new Set(equipment.map(e => e.equipment_type)));
  
  // Filter equipment by type if a filter is selected
  const filteredEquipment = filterType 
    ? equipment.filter(e => e.equipment_type === filterType)
    : equipment;
  
  if (equipment.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Equipment Found</h3>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          This customer doesn't have any equipment records yet. Add their HVAC equipment details to keep track of service history.
        </p>
        <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddClick}>
          + Add Equipment
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filterType === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(null)}
          className={filterType === null ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          All Equipment
        </Button>
        
        {equipmentTypes.map(type => (
          <Button
            key={type}
            variant={filterType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type)}
            className={filterType === type ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {EquipmentTypeLabels[type as keyof typeof EquipmentTypeLabels] || type}
          </Button>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          onClick={onAddClick}
        >
          + Add Equipment
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEquipment.map((item) => (
          <EquipmentCard 
            key={item.id} 
            equipment={item} 
            onClick={() => onViewEquipment(item)}
          />
        ))}
      </div>
    </div>
  );
}

interface EquipmentCardProps {
  equipment: Equipment;
  onClick: () => void;
}

function EquipmentCard({ equipment, onClick }: EquipmentCardProps) {
  // Format installation date if available
  const formattedInstallDate = equipment.installation_date 
    ? new Date(equipment.installation_date).toLocaleDateString()
    : 'Unknown';
    
  // Determine status badge styles
  const getServiceStatusBadge = () => {
    switch(equipment.service_status) {
      case 'good':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Up to date</span>;
      case 'due_soon':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Service due soon</span>;
      case 'overdue':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Service overdue</span>;
      default:
        return null;
    }
  };
  
  // Determine warranty badge styles
  const getWarrantyStatusBadge = () => {
    switch(equipment.warranty_status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Warranty active</span>;
      case 'expired':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Warranty expired</span>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium
                ${equipment.equipment_type === 'air_conditioner' ? 'bg-blue-500' : ''}
                ${equipment.equipment_type === 'furnace' ? 'bg-orange-500' : ''}
                ${equipment.equipment_type === 'heat_pump' ? 'bg-purple-500' : ''}
                ${equipment.equipment_type === 'boiler' ? 'bg-red-500' : ''}
                ${equipment.equipment_type === 'mini_split' ? 'bg-teal-500' : ''}
                ${equipment.equipment_type === 'packaged_unit' ? 'bg-emerald-500' : ''}
                ${equipment.equipment_type === 'air_handler' ? 'bg-indigo-500' : ''}
                ${!['air_conditioner', 'furnace', 'heat_pump', 'boiler', 'mini_split', 'packaged_unit', 'air_handler'].includes(equipment.equipment_type) ? 'bg-gray-500' : ''}
              `}>
                {equipment.equipment_type === 'air_conditioner' && 'AC'}
                {equipment.equipment_type === 'furnace' && 'FN'}
                {equipment.equipment_type === 'heat_pump' && 'HP'}
                {equipment.equipment_type === 'boiler' && 'BL'}
                {equipment.equipment_type === 'mini_split' && 'MS'}
                {equipment.equipment_type === 'packaged_unit' && 'PU'}
                {equipment.equipment_type === 'air_handler' && 'AH'}
                {equipment.equipment_type === 'thermostats' && 'TH'}
                {equipment.equipment_type === 'other' && 'OT'}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {EquipmentTypeLabels[equipment.equipment_type as keyof typeof EquipmentTypeLabels] || equipment.equipment_type}
                </h3>
                <p className="text-xs text-gray-500">
                  {equipment.make} {equipment.model}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex flex-wrap gap-1 justify-end">
                {getServiceStatusBadge()}
                {getWarrantyStatusBadge()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <div>
                <span className="text-gray-500">Serial Number:</span>
                <span className="ml-1 text-gray-700 font-medium">
                  {equipment.serial_number || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Installed:</span>
                <span className="ml-1 text-gray-700 font-medium">
                  {formattedInstallDate}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-1 text-gray-700">
                  {equipment.location || 'Not specified'}
                </span>
              </div>
              <div>
                {equipment.tonnage && (
                  <span className="ml-2 text-gray-700">
                    {equipment.tonnage} ton
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500">Last serviced:</span>
              <span className="ml-1 text-gray-700">
                {equipment.last_service_date 
                  ? new Date(equipment.last_service_date).toLocaleDateString() 
                  : 'Never'}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
            <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              View Details →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}