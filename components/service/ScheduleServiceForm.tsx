import React, { useState } from 'react';
import { Job, JobTypeLabels, JobPriorityLabels, CommonJobIssues } from '@/types/service';
import { Equipment, EquipmentTypeLabels } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ScheduleServiceFormProps {
  contactId: number;
  businessSlug: string;
  equipment: Equipment[];
  job?: Job;
  onSave: (jobData: Partial<Job>) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function ScheduleServiceForm({
  contactId,
  businessSlug,
  equipment,
  job,
  onSave,
  onCancel,
  isSaving
}: ScheduleServiceFormProps) {
  const isEditMode = !!job;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Job>>(
    job || {
      customer_id: contactId,
      company_id: businessSlug,
      description: '',
      status: 'scheduled',
      priority: 'medium',
      job_type: 'maintenance',
      equipment_id: equipment.length > 0 ? equipment[0].id : null,
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time_start: '09:00',
      scheduled_time_end: '11:00',
      technician: '',
      notes: ''
    }
  );
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date/time fields
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // Quick select for common issues
  const addCommonIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description 
        ? `${prev.description.trim()}${prev.description.endsWith('.') ? ' ' : '. '}${issue}.` 
        : `${issue}.`
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditMode ? 'Edit Service Appointment' : 'Schedule New Service'}
        </h2>
      </div>
      
      {/* Equipment Selection */}
      <div>
        <Label htmlFor="equipment_id">
          Equipment to Service
        </Label>
        <select
          id="equipment_id"
          name="equipment_id"
          value={formData.equipment_id || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        >
          <option value="">Select equipment (optional)</option>
          {equipment.map(item => (
            <option key={item.id} value={item.id}>
              {EquipmentTypeLabels[item.equipment_type as keyof typeof EquipmentTypeLabels] || item.equipment_type} - {item.make} {item.model}
            </option>
          ))}
        </select>
      </div>
      
      {/* Job Type and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job_type">
            Service Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="job_type"
            name="job_type"
            value={formData.job_type || 'maintenance'}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {Object.entries(JobTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="priority">
            Priority <span className="text-red-500">*</span>
          </Label>
          <select
            id="priority"
            name="priority"
            value={formData.priority || 'medium'}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {Object.entries(JobPriorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="scheduled_date">
            Appointment Date <span className="text-red-500">*</span>
          </Label>
          <Input
            type="date"
            id="scheduled_date"
            name="scheduled_date"
            value={formData.scheduled_date ? formData.scheduled_date.toString().substring(0, 10) : ''}
            onChange={handleDateTimeChange}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="scheduled_time_start">
            Start Time <span className="text-red-500">*</span>
          </Label>
          <Input
            type="time"
            id="scheduled_time_start"
            name="scheduled_time_start"
            value={formData.scheduled_time_start || ''}
            onChange={handleDateTimeChange}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="scheduled_time_end">
            End Time
          </Label>
          <Input
            type="time"
            id="scheduled_time_end"
            name="scheduled_time_end"
            value={formData.scheduled_time_end || ''}
            onChange={handleDateTimeChange}
            className="mt-1"
          />
        </div>
      </div>
      
      {/* Technician */}
      <div>
        <Label htmlFor="technician">
          Assigned Technician
        </Label>
        <Input
          type="text"
          id="technician"
          name="technician"
          value={formData.technician || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="e.g., John Smith"
        />
      </div>
      
      {/* Issue Description */}
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="description">
            Issue Description <span className="text-red-500">*</span>
          </Label>
          <span className="text-xs text-gray-500">
            Common issues:
          </span>
        </div>
        
        {/* Quick-select common issues */}
        <div className="flex flex-wrap gap-1 mt-1 mb-2">
          {CommonJobIssues.slice(0, 5).map((issue) => (
            <button
              key={issue}
              type="button"
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => addCommonIssue(issue)}
            >
              +{issue}
            </button>
          ))}
        </div>
        
        <Textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description || ''}
          onChange={handleInputChange}
          required
          className="mt-1"
          placeholder="Describe the issue or service needed..."
        />
      </div>
      
      {/* Notes */}
      <div>
        <Label htmlFor="notes">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          value={formData.notes || ''}
          onChange={handleInputChange}
          className="mt-1"
          placeholder="Any additional instructions or access information..."
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
          ) : isEditMode ? 'Update Appointment' : 'Schedule Service'}
        </Button>
      </div>
    </form>
  );
}