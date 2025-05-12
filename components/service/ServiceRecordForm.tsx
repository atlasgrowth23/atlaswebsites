import React, { useState } from 'react';
import { ServiceRecord } from '@/types/service';
import { Equipment, EquipmentTypeLabels, ServiceTypes, CommonHvacParts, CommonRecommendations } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ServiceRecordFormProps {
  equipmentId: number;
  businessSlug: string;
  equipment: Equipment[];
  jobId?: number;
  record?: ServiceRecord;
  onSave: (recordData: Partial<ServiceRecord>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function ServiceRecordForm({
  equipmentId,
  businessSlug,
  equipment,
  jobId,
  record,
  onSave,
  onCancel,
  isSaving
}: ServiceRecordFormProps) {
  const isEditMode = !!record;
  
  // Find the current equipment
  const currentEquipment = equipment.find(e => e.id === equipmentId);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ServiceRecord>>(
    record || {
      equipment_id: equipmentId,
      company_id: businessSlug,
      job_id: jobId || null,
      service_date: new Date().toISOString().split('T')[0],
      service_type: '',
      technician: '',
      findings: '',
      work_performed: '',
      parts_used: '',
      recommendations: '',
      follow_up_required: false
    }
  );
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date fields
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Quick add helpers
  const addToField = (field: string, text: string) => {
    setFormData(prev => {
      const currentValue = prev[field as keyof typeof prev] as string || '';
      const newValue = currentValue 
        ? `${currentValue.trim()}${currentValue.endsWith('.') ? ' ' : '. '}${text}` 
        : text;
      
      return {
        ...prev,
        [field]: newValue
      };
    });
  };
  
  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditMode ? 'Edit Service Record' : 'Create Service Record'}
        </h2>
        
        {currentEquipment && (
          <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">
              {EquipmentTypeLabels[currentEquipment.equipment_type as keyof typeof EquipmentTypeLabels] || currentEquipment.equipment_type}
            </h3>
            <p className="text-sm text-gray-600">
              {currentEquipment.make} {currentEquipment.model} - S/N: {currentEquipment.serial_number}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentEquipment.location ? `Location: ${currentEquipment.location}` : ''}
            </p>
          </div>
        )}
      </div>
      
      {/* Equipment Selection (only if not already selected) */}
      {!equipmentId && (
        <div>
          <Label htmlFor="equipment_id">
            Equipment <span className="text-red-500">*</span>
          </Label>
          <select
            id="equipment_id"
            name="equipment_id"
            value={formData.equipment_id || ''}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Select equipment</option>
            {equipment.map(item => (
              <option key={item.id} value={item.id}>
                {EquipmentTypeLabels[item.equipment_type as keyof typeof EquipmentTypeLabels] || item.equipment_type} - {item.make} {item.model}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_date">
            Service Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            id="service_date"
            name="service_date"
            value={formData.service_date ? formData.service_date.toString().substring(0, 10) : ''}
            onChange={handleDateChange}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="technician">
            Technician <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="technician"
            name="technician"
            value={formData.technician || ''}
            onChange={handleInputChange}
            required
            className="mt-1"
            placeholder="e.g., John Smith"
          />
        </div>
      </div>
      
      {/* Service Type */}
      <div>
        <Label htmlFor="service_type">
          Service Type <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          id="service_type"
          name="service_type"
          value={formData.service_type || ''}
          onChange={handleInputChange}
          required
          className="mt-1"
          placeholder="e.g., Annual Maintenance, Repair, etc."
          list="service-types"
        />
        <datalist id="service-types">
          {ServiceTypes.map(type => (
            <option key={type} value={type} />
          ))}
        </datalist>
      </div>
      
      {/* Findings */}
      <div>
        <Label htmlFor="findings">
          Findings <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="findings"
          name="findings"
          rows={3}
          value={formData.findings || ''}
          onChange={handleInputChange}
          required
          className="mt-1"
          placeholder="Describe what was found during the service visit..."
        />
      </div>
      
      {/* Work Performed */}
      <div>
        <Label htmlFor="work_performed">
          Work Performed <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="work_performed"
          name="work_performed"
          rows={3}
          value={formData.work_performed || ''}
          onChange={handleInputChange}
          required
          className="mt-1"
          placeholder="Describe the work that was performed..."
        />
      </div>
      
      {/* Parts Used */}
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="parts_used">
            Parts Used
          </Label>
          <span className="text-xs text-gray-500">
            Common parts:
          </span>
        </div>
        
        {/* Quick-select common parts */}
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {CommonHvacParts.slice(0, 5).map((part) => (
            <button
              key={part}
              type="button"
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => addToField('parts_used', part)}
            >
              +{part}
            </button>
          ))}
        </div>
        
        <Textarea
          id="parts_used"
          name="parts_used"
          rows={2}
          value={formData.parts_used || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="List any parts that were used or replaced..."
        />
      </div>
      
      {/* Recommendations */}
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="recommendations">
            Recommendations
          </Label>
          <span className="text-xs text-gray-500">
            Common recommendations:
          </span>
        </div>
        
        {/* Quick-select common recommendations */}
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {CommonRecommendations.slice(0, 4).map((rec) => (
            <button
              key={rec}
              type="button"
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => addToField('recommendations', rec)}
            >
              +{rec}
            </button>
          ))}
        </div>
        
        <Textarea
          id="recommendations"
          name="recommendations"
          rows={2}
          value={formData.recommendations || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="Any recommendations for future service or maintenance..."
        />
      </div>
      
      {/* Follow-up Required */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="follow_up_required"
          name="follow_up_required"
          checked={formData.follow_up_required || false}
          onChange={handleInputChange}
          className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
        <Label htmlFor="follow_up_required" className="text-sm cursor-pointer">
          Follow-up service required
        </Label>
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
          ) : isEditMode ? 'Update Service Record' : 'Save Service Record'}
        </Button>
      </div>
    </form>
  );
}