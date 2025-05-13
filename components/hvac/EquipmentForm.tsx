import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Equipment, 
  EquipmentType, 
  EquipmentTypeLabels, 
  CommonEquipmentMakes, 
  RefrigerantTypes 
} from '@/types/equipment';

interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentData: Partial<Equipment>) => Promise<void>;
  existingEquipment?: Equipment;
  isEdit?: boolean;
  businessId: string;
  preselectedContactId?: number;
}

export default function EquipmentForm({
  isOpen,
  onClose,
  onSave,
  existingEquipment,
  isEdit = false,
  businessId,
  preselectedContactId
}: EquipmentFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<Equipment>>({
    company_id: businessId,
    contact_id: preselectedContactId || 0,
    equipment_type: 'air_conditioner',
    make: '',
    model: '',
    serial_number: '',
    installation_date: null,
    btu_rating: null,
    tonnage: null,
    efficiency_rating: null,
    refrigerant_type: null,
    location: null,
    notes: null,
    warranty_expiration: null,
    warranty_details: null
  });
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Initialize with existing equipment data if in edit mode
  useEffect(() => {
    if (isEdit && existingEquipment) {
      setFormData({
        ...existingEquipment,
        // Convert date strings to YYYY-MM-DD format for input fields
        installation_date: existingEquipment.installation_date ? formatDateForInput(existingEquipment.installation_date) : null,
        warranty_expiration: existingEquipment.warranty_expiration ? formatDateForInput(existingEquipment.warranty_expiration) : null,
      });
    }
  }, [isEdit, existingEquipment]);
  
  // Format date string to YYYY-MM-DD for input fields
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  
  // Fetch contacts
  useEffect(() => {
    // Demo contacts
    const demoContacts: Contact[] = [
      {
        id: 1,
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john@example.com'
      },
      {
        id: 2,
        name: 'Sarah Williams',
        phone: '(555) 987-6543',
        email: 'sarah@example.com'
      },
      {
        id: 3,
        name: 'Michael Rodriguez',
        phone: '(555) 345-6789',
        email: 'michael@example.com'
      },
      {
        id: 4,
        name: 'Emily Johnson',
        phone: '(555) 555-1234',
        email: 'emily@example.com'
      },
      {
        id: 5,
        name: 'Robert Davis',
        phone: '(555) 222-3333',
        email: 'robert@example.com'
      }
    ];
    
    setContacts(demoContacts);
    
    // In a real implementation, fetch from API
    // if (businessId) {
    //   fetch(`/api/hvac/contacts?company_id=${businessId}`)
    //     .then(response => response.json())
    //     .then(data => {
    //       if (data.success && data.contacts) {
    //         setContacts(data.contacts);
    //       }
    //     })
    //     .catch(err => {
    //       console.error('Error fetching contacts:', err);
    //     });
    // }
  }, [businessId]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types appropriately
    if (type === 'number') {
      const numberValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numberValue }));
    } else if (type === 'date') {
      const dateValue = value === '' ? null : value;
      setFormData(prev => ({ ...prev, [name]: dateValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle contact selection
  const handleSelectContact = (contact: Contact) => {
    setFormData(prev => ({ 
      ...prev, 
      contact_id: contact.id,
      contact_name: contact.name // For display only, not part of Equipment type
    }));
    setIsSearching(false);
    setSearchQuery('');
  };
  
  // Get selected contact
  const selectedContact = contacts.find(c => c.id === formData.contact_id);
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.includes(query))
    );
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!formData.equipment_type || !formData.make || !formData.model || !formData.serial_number) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!formData.contact_id) {
        throw new Error('Please select a customer');
      }
      
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the equipment');
      console.error('Error saving equipment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Equipment' : 'Add New Equipment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Customer Selection (only show if not preselected) */}
              {!preselectedContactId && (
                <div>
                  <Label htmlFor="customer" className="text-sm font-medium text-gray-700 block mb-1">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  {selectedContact ? (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md">
                      <div>
                        <span className="font-medium">{selectedContact.name}</span>
                        <span className="text-sm text-gray-500 ml-2">#{selectedContact.id}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, contact_id: 0, contact_name: undefined }))}
                      >
                        Change Customer
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex">
                        <Input
                          type="text"
                          placeholder="Search customers by name, email, or phone"
                          value={searchQuery}
                          onChange={e => {
                            setSearchQuery(e.target.value);
                            setIsSearching(true);
                          }}
                          onFocus={() => setIsSearching(true)}
                          className="w-full"
                        />
                        <Button
                          type="button"
                          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          + New Customer
                        </Button>
                      </div>
                      
                      {isSearching && filteredContacts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <ul className="py-1">
                            {filteredContacts.map(contact => (
                              <li 
                                key={contact.id} 
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleSelectContact(contact)}
                              >
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-gray-500 flex">
                                  {contact.phone && <span className="mr-3">{contact.phone}</span>}
                                  {contact.email && <span>{contact.email}</span>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Basic Equipment Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Equipment Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment_type" className="text-sm font-medium text-gray-700 block mb-1">
                      Equipment Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="equipment_type"
                      name="equipment_type"
                      value={formData.equipment_type || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    >
                      {Object.entries(EquipmentTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 block mb-1">
                      Location
                    </Label>
                    <Input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                      placeholder="e.g., Backyard, Basement, Attic"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Make, Model, Serial Number */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="make" className="text-sm font-medium text-gray-700 block mb-1">
                    Make <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="make"
                    name="make"
                    value={formData.make || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    <option value="">Select Make</option>
                    {CommonEquipmentMakes.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="model" className="text-sm font-medium text-gray-700 block mb-1">
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    placeholder="e.g., Infinity 26, XR80"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="serial_number" className="text-sm font-medium text-gray-700 block mb-1">
                    Serial Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="serial_number"
                    name="serial_number"
                    value={formData.serial_number || ''}
                    onChange={handleChange}
                    placeholder="e.g., AC123456789"
                    required
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Technical Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="btu_rating" className="text-sm font-medium text-gray-700 block mb-1">
                      BTU Rating
                    </Label>
                    <Input
                      type="number"
                      id="btu_rating"
                      name="btu_rating"
                      value={formData.btu_rating || ''}
                      onChange={handleChange}
                      placeholder="e.g., 36000"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tonnage" className="text-sm font-medium text-gray-700 block mb-1">
                      Tonnage
                    </Label>
                    <Input
                      type="number"
                      id="tonnage"
                      name="tonnage"
                      value={formData.tonnage || ''}
                      onChange={handleChange}
                      placeholder="e.g., 3.0"
                      step="0.5"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="efficiency_rating" className="text-sm font-medium text-gray-700 block mb-1">
                      Efficiency Rating
                    </Label>
                    <Input
                      type="text"
                      id="efficiency_rating"
                      name="efficiency_rating"
                      value={formData.efficiency_rating || ''}
                      onChange={handleChange}
                      placeholder="e.g., 16 SEER, 80% AFUE"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="refrigerant_type" className="text-sm font-medium text-gray-700 block mb-1">
                      Refrigerant Type
                    </Label>
                    <select
                      id="refrigerant_type"
                      name="refrigerant_type"
                      value={formData.refrigerant_type || ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="">Select Refrigerant</option>
                      {RefrigerantTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Installation and Warranty */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Installation & Warranty</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="installation_date" className="text-sm font-medium text-gray-700 block mb-1">
                      Installation Date
                    </Label>
                    <Input
                      type="date"
                      id="installation_date"
                      name="installation_date"
                      value={formData.installation_date || ''}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="warranty_expiration" className="text-sm font-medium text-gray-700 block mb-1">
                      Warranty Expiration Date
                    </Label>
                    <Input
                      type="date"
                      id="warranty_expiration"
                      name="warranty_expiration"
                      value={formData.warranty_expiration || ''}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="warranty_details" className="text-sm font-medium text-gray-700 block mb-1">
                      Warranty Details
                    </Label>
                    <Input
                      type="text"
                      id="warranty_details"
                      name="warranty_details"
                      value={formData.warranty_details || ''}
                      onChange={handleChange}
                      placeholder="e.g., 10 year parts, 5 year labor"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block mb-1">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Any additional information about this equipment..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              
              {/* Form buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    isEdit ? 'Update Equipment' : 'Add Equipment'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}