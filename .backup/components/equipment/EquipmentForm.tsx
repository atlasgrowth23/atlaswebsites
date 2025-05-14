import React, { useState } from 'react';
import { 
  Equipment, 
  EquipmentTypeLabels, 
  CommonEquipmentMakes, 
  RefrigerantTypes 
} from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EquipmentFormProps {
  contactId: number;
  businessSlug: string;
  equipment?: Equipment;
  onSave: (equipmentData: Partial<Equipment>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function EquipmentForm({ 
  contactId, 
  businessSlug, 
  equipment, 
  onSave, 
  onCancel,
  isSaving 
}: EquipmentFormProps) {
  const isEditMode = !!equipment;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Equipment>>(
    equipment || {
      equipment_type: 'air_conditioner',
      make: '',
      model: '',
      serial_number: '',
      installation_date: '',
      btu_rating: null,
      tonnage: null,
      efficiency_rating: '',
      refrigerant_type: '',
      location: '',
      notes: '',
      warranty_expiration: '',
      warranty_details: '',
    }
  );
  
  // Helper to set a date field as a string
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? value : null
    }));
  };
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle number fields
    if (type === 'number') {
      const numberValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numberValue
      }));
      return;
    }
    
    // Handle all other fields
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add contact ID and company ID
    const equipmentData = {
      ...formData,
      contact_id: contactId,
      company_id: businessSlug
    };
    
    onSave(equipmentData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
        </h2>
      </div>
      
      {/* Equipment Type, Make, Model */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="equipment_type">
            Equipment Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="equipment_type"
            name="equipment_type"
            value={formData.equipment_type}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {Object.entries(EquipmentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="make">
            Make/Brand <span className="text-red-500">*</span>
          </Label>
          <Input
            id="make"
            name="make"
            type="text"
            value={formData.make || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
            placeholder="Carrier, Trane, etc."
            list="equipment-makes"
          />
          <datalist id="equipment-makes">
            {CommonEquipmentMakes.map(make => (
              <option key={make} value={make} />
            ))}
          </datalist>
        </div>
        
        <div>
          <Label htmlFor="model">
            Model <span className="text-red-500">*</span>
          </Label>
          <Input
            id="model"
            name="model"
            type="text"
            value={formData.model || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
            placeholder="XR14"
          />
        </div>
      </div>
      
      {/* Serial, Install Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serial_number">
            Serial Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="serial_number"
            name="serial_number"
            type="text"
            value={formData.serial_number || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
            placeholder="12345678ABC"
          />
        </div>
        
        <div>
          <Label htmlFor="installation_date">Installation Date</Label>
          <Input
            id="installation_date"
            name="installation_date"
            type="date"
            value={formData.installation_date ? formData.installation_date.toString().substring(0, 10) : ''}
            onChange={handleDateChange}
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Technical Specs: Tonnage, Refrigerant, Efficiency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="tonnage">System Size (Tons)</Label>
          <Input
            id="tonnage"
            name="tonnage"
            type="number"
            step="0.5"
            min="0"
            max="20"
            value={formData.tonnage === null ? '' : formData.tonnage}
            onChange={handleInputChange}
            className="mt-1"
            placeholder="e.g., 3.5"
          />
        </div>
        
        <div>
          <Label htmlFor="refrigerant_type">Refrigerant Type</Label>
          <Input
            id="refrigerant_type"
            name="refrigerant_type"
            type="text"
            value={formData.refrigerant_type || ''}
            onChange={handleInputChange}
            className="mt-1"
            placeholder="R-410A"
            list="refrigerant-types"
          />
          <datalist id="refrigerant-types">
            {RefrigerantTypes.map(type => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>
        
        <div>
          <Label htmlFor="efficiency_rating">Efficiency Rating</Label>
          <Input
            id="efficiency_rating"
            name="efficiency_rating"
            type="text"
            value={formData.efficiency_rating || ''}
            onChange={handleInputChange}
            className="mt-1"
            placeholder="e.g., 16 SEER"
          />
        </div>
      </div>
      
      {/* Location */}
      <div>
        <Label htmlFor="location">Location in Home</Label>
        <Input
          id="location"
          name="location"
          type="text"
          value={formData.location || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="e.g., Basement, Attic, Outside North Wall"
        />
      </div>
      
      {/* Warranty Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
          <Input
            id="warranty_expiration"
            name="warranty_expiration"
            type="date"
            value={formData.warranty_expiration ? formData.warranty_expiration.toString().substring(0, 10) : ''}
            onChange={handleDateChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="warranty_details">Warranty Details</Label>
          <Input
            id="warranty_details"
            name="warranty_details"
            type="text"
            value={formData.warranty_details || ''}
            onChange={handleInputChange}
            className="mt-1"
            placeholder="e.g., 10yr parts, 5yr labor"
          />
        </div>
      </div>
      
      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="Additional details about this equipment..."
        />
      </div>
      
      {/* Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-3 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : isEditMode ? 'Update Equipment' : 'Add Equipment'}
        </Button>
      </div>
    </form>
  );
}