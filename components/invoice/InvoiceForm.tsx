import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import LineItemsEditor from '@/components/invoice/LineItemsEditor';
import { Invoice, InvoiceItem, InvoiceStatusLabels, StandardTermsTemplate, StandardPaymentInstructionsTemplate } from '@/types/invoice';

interface InvoiceFormProps {
  invoiceData?: Partial<Invoice>;
  businessId: string;
  onSave: (invoice: Partial<Invoice>) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  isSaving?: boolean;
}

export default function InvoiceForm({
  invoiceData,
  businessId,
  onSave,
  onCancel,
  isEdit = false,
  isSaving = false
}: InvoiceFormProps) {
  // Initialize form state
  const [formData, setFormData] = useState<Partial<Invoice>>(
    invoiceData || {
      company_id: businessId,
      contact_id: 0,
      invoice_number: '',
      subtotal_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      date_issued: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      terms: StandardTermsTemplate.replace('[X]', '30'),
      payment_instructions: StandardPaymentInstructionsTemplate,
      items: []
    }
  );
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(0);
  
  // Fetch contacts for the dropdown
  useEffect(() => {
    async function fetchContacts() {
      setIsLoadingContacts(true);
      setContactError(null);
      
      try {
        // Demo contacts for development
        const demoContacts = [
          {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345'
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.j@example.com',
            phone: '(555) 987-6543',
            address: '456 Oak Ave',
            city: 'Springfield',
            state: 'IL',
            zip: '67890'
          },
          {
            id: 3,
            name: 'Mike Wilson',
            email: 'mike.w@example.com',
            phone: '(555) 555-5555',
            address: '789 Pine Blvd',
            city: 'Riverside',
            state: 'CA',
            zip: '54321'
          },
          {
            id: 4,
            name: 'Emily Davis',
            email: 'emily.davis@example.com',
            phone: '(555) 444-3333',
            address: '321 Elm St',
            city: 'Lakeside',
            state: 'NY',
            zip: '09876'
          },
          {
            id: 5,
            name: 'Robert Brown',
            email: 'robert.b@example.com',
            phone: '(555) 222-3333',
            address: '654 Maple Dr',
            city: 'Hillcrest',
            state: 'TX',
            zip: '45678'
          }
        ];
        
        setContacts(demoContacts);
        
        // Try to fetch from API but don't block UI
        try {
          const response = await fetch(`/api/hvac/contacts?company_id=${businessId}`);
          const data = await response.json();
          
          if (data.success && data.contacts?.length > 0) {
            setContacts(data.contacts);
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }
        
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setContactError('Failed to load contacts. Please try again.');
      } finally {
        setIsLoadingContacts(false);
      }
    }
    
    // Fetch invoice settings for default tax rate
    async function fetchInvoiceSettings() {
      try {
        // Try to fetch from API 
        const response = await fetch(`/api/hvac/invoice-settings?company_id=${businessId}`);
        const data = await response.json();
        
        if (data.success && data.settings) {
          setTaxRate(data.settings.default_tax_rate || 0);
          
          // If it's a new invoice, apply default settings
          if (!isEdit && !invoiceData?.id) {
            setFormData(prev => ({
              ...prev,
              invoice_number: data.settings.next_invoice_number ? `INV-${data.settings.next_invoice_number}` : prev.invoice_number,
              terms: data.settings.invoice_terms_template || prev.terms,
              payment_instructions: data.settings.payment_instructions_template || prev.payment_instructions
            }));
          }
        }
      } catch (apiError) {
        console.error('API error fetching invoice settings:', apiError);
      }
    }
    
    fetchContacts();
    fetchInvoiceSettings();
  }, [businessId, isEdit, invoiceData]);
  
  // Update form data
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Update line items and recalculate totals
  const handleItemsChange = (items: InvoiceItem[]) => {
    // Calculate subtotal, tax, and total
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = items.reduce((sum, item) => {
      const taxAmount = item.tax_amount || (item.amount * (item.tax_rate || 0) / 100);
      return sum + taxAmount;
    }, 0);
    const total = subtotal + taxTotal;
    
    setFormData(prev => ({
      ...prev,
      items,
      subtotal_amount: subtotal,
      tax_amount: taxTotal,
      total_amount: total
    }));
  };
  
  // Format date for input field
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };
  
  // Get selected contact details
  const selectedContact = contacts.find(c => c.id === Number(formData.contact_id));
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Left column */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Invoice Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="invoice_number">Invoice Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="invoice_number"
                    name="invoice_number"
                    value={formData.invoice_number || ''}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                    disabled={isEdit} // Don't allow changing invoice number on edit
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || 'draft'}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={!isEdit} // Only allow changing status on edit
                  >
                    {Object.entries(InvoiceStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="date_issued">Issue Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="date_issued"
                    name="date_issued"
                    type="date"
                    value={formatDateForInput(formData.date_issued)}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="due_date">Due Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formatDateForInput(formData.due_date)}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="contact_id">Customer <span className="text-red-500">*</span></Label>
                  <select
                    id="contact_id"
                    name="contact_id"
                    value={formData.contact_id || ''}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoadingContacts}
                  >
                    <option value="">Select a customer</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} - {contact.email}
                      </option>
                    ))}
                  </select>
                  {isLoadingContacts && <p className="text-sm text-gray-500 mt-1">Loading contacts...</p>}
                  {contactError && <p className="text-sm text-red-500 mt-1">{contactError}</p>}
                </div>
              </div>
              
              <div className="mb-6">
                <Label>Line Items</Label>
                <div className="mt-2 border rounded-md p-4 bg-gray-50">
                  <LineItemsEditor
                    items={formData.items || []}
                    onChange={handleItemsChange}
                    taxRate={taxRate}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Enter any notes for this invoice"
                  />
                </div>
                
                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    name="terms"
                    value={formData.terms || ''}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Enter terms and conditions"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="payment_instructions">Payment Instructions</Label>
                  <Textarea
                    id="payment_instructions"
                    name="payment_instructions"
                    value={formData.payment_instructions || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1"
                    placeholder="Enter payment instructions"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Customer Details</h3>
              
              {selectedContact ? (
                <div className="space-y-3">
                  <div className="font-medium text-gray-900">{selectedContact.name}</div>
                  {selectedContact.email && <div>{selectedContact.email}</div>}
                  {selectedContact.phone && <div>{selectedContact.phone}</div>}
                  {selectedContact.address && (
                    <div>
                      <div>{selectedContact.address}</div>
                      <div>
                        {selectedContact.city}, {selectedContact.state} {selectedContact.zip}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open(`/hvacportal/contacts/${selectedContact.id}`, '_blank')}
                  >
                    View Contact Details
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No customer selected. Please choose a customer from the dropdown.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Actions</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button 
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </div>
                    ) : isEdit ? 'Update Invoice' : 'Create Invoice'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}