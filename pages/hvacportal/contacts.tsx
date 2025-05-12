import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Equipment } from '@/types/equipment';
import ContactDetailView from '@/components/hvac/ContactDetailView';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lastServiceDate: string | null;
  createdAt: string;
}

export default function ContactsPage() {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });

  // State for contacts data from the API
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Set demo data
        setContacts([
          {
            id: 1,
            name: "John Smith",
            email: "john@example.com",
            phone: "(555) 123-4567",
            address: "123 Main St",
            city: "Anytown",
            state: "CA",
            zip: "12345",
            notes: "Loyal customer since 2018. Has central AC system.",
            lastServiceDate: new Date('2023-06-15').toISOString(),
            createdAt: new Date('2018-03-10').toISOString()
          },
          {
            id: 2,
            name: "Sarah Johnson",
            email: "sarah@example.com",
            phone: "(555) 987-6543",
            address: "456 Oak Avenue",
            city: "Springfield",
            state: "IL",
            zip: "62701",
            notes: "Prefers appointments in the morning. Has heat pump system.",
            lastServiceDate: new Date('2023-09-22').toISOString(),
            createdAt: new Date('2020-05-18').toISOString()
          },
          {
            id: 3,
            name: "Michael Rodriguez",
            email: "michael@example.com",
            phone: "(555) 345-6789",
            address: "789 Pine Street",
            city: "Riverdale",
            state: "NY",
            zip: "10471",
            notes: "Multiple properties. Primary location has dual-zone system.",
            lastServiceDate: null,
            createdAt: new Date('2022-11-05').toISOString()
          }
        ]);

        // Also try the API but don't wait for it
        fetch(`/api/contacts?businessSlug=${storedBusinessSlug}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.contacts && data.contacts.length > 0) {
              // Transform data to match our Contact interface
              const formattedContacts: Contact[] = data.contacts.map((contact: any) => ({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                address: contact.address,
                city: contact.city,
                state: contact.state,
                zip: contact.zip,
                notes: contact.notes,
                lastServiceDate: contact.last_service_date,
                createdAt: contact.created_at
              }));

              setContacts(formattedContacts);
            }
          })
          .catch(err => {
            console.error('API error (non-blocking):', err);
          });
      } catch (err) {
        console.error('Error in contact initialization:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContacts();
  }, []);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.phone.includes(query) ||
        contact.address.toLowerCase().includes(query) ||
        contact.city.toLowerCase().includes(query) ||
        contact.notes.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Format date to a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No data";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  // Create contact form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessSlug || !newContact.name) return;

    setIsSaving(true);

    try {
      // Create a demo contact that works without database connection
      const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;

      const newContactData = {
        id: newId,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        address: newContact.address,
        city: newContact.city,
        state: newContact.state,
        zip: newContact.zip,
        notes: newContact.notes,
        lastServiceDate: null,
        createdAt: new Date().toISOString()
      };

      // Add the new contact to the state
      setContacts(prev => [newContactData, ...prev]);

      // Reset form and close modal
      setNewContact({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        notes: ''
      });
      setShowCreateModal(false);

      // Attempt API call but don't block UI
      fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContact,
          businessSlug
        }),
      }).then(response => {
        console.log('API response:', response.status);
        return response.json();
      }).then(data => {
        console.log('Contact created in DB:', data);
      }).catch(err => {
        console.error('Error in background API call:', err);
      });
    } catch (err) {
      console.error('Error creating contact:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with search and add new button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your customer contacts and their information</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search contacts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Contact
            </Button>
          </div>
        </div>

        {/* Contact List or Detail View */}
        {showDetails && selectedContact ? (
          <ContactDetailView
            contact={selectedContact}
            onClose={handleCloseDetails}
            equipmentList={[
              {
                id: 1,
                company_id: businessSlug || 'demo',
                contact_id: selectedContact.id,
                equipment_type: 'air_conditioner',
                make: 'Carrier',
                model: 'Infinity 26',
                serial_number: 'AC298374662',
                installation_date: '2020-05-15',
                btu_rating: 36000,
                tonnage: 3.0,
                efficiency_rating: '26 SEER',
                refrigerant_type: 'R-410A',
                location: 'Backyard',
                notes: 'Premium high-efficiency unit installed after customer had issues with previous builder-grade system.',
                warranty_expiration: '2030-05-15',
                warranty_details: '10 year parts, 10 year compressor',
                last_service_date: '2023-04-10',
                next_service_date: '2024-04-10',
                image_url: null,
                created_at: '2020-05-15T10:30:00Z',
                updated_at: '2023-04-10T14:22:15Z',
                service_status: 'good',
                warranty_status: 'active'
              },
              {
                id: 2,
                company_id: businessSlug || 'demo',
                contact_id: selectedContact.id,
                equipment_type: 'furnace',
                make: 'Trane',
                model: 'XR80',
                serial_number: 'TNF87652310',
                installation_date: '2018-10-05',
                btu_rating: 80000,
                tonnage: null,
                efficiency_rating: '80% AFUE',
                refrigerant_type: null,
                location: 'Basement',
                notes: 'Standard efficiency furnace. Customer interested in upgrading to high-efficiency model in the future.',
                warranty_expiration: '2028-10-05',
                warranty_details: '10 year parts, lifetime heat exchanger',
                last_service_date: '2022-11-15',
                next_service_date: '2023-11-15',
                image_url: null,
                created_at: '2018-10-05T15:45:22Z',
                updated_at: '2022-11-15T09:33:47Z',
                service_status: 'due_soon',
                warranty_status: 'active'
              }
            ]}
            onSaveEquipment={async (equipmentData) => {
              // For demo purposes, creating a new ID if adding new equipment
              if (equipmentData.id) {
                // Return updated equipment for demo
                return equipmentData as Equipment;
              } else {
                // Return new equipment for demo
                return {
                  ...equipmentData,
                  id: Math.floor(Math.random() * 1000) + 3, // Random ID for demo
                  created_at: new Date().toISOString(),
                  updated_at: null,
                  last_service_date: null,
                  next_service_date: null,
                  image_url: null,
                  service_status: 'good' as const,
                  warranty_status: equipmentData.warranty_expiration ? 'active' as const : 'unknown' as const
                } as Equipment;
              }
            }}
          />
        ) : (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                  <p className="mt-3 text-gray-500">Loading contacts...</p>
                </div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <EmptyStateCard searchQuery={searchQuery} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map(contact => (
                  <ContactCard 
                    key={contact.id} 
                    contact={contact} 
                    onView={() => handleViewContact(contact)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Contact Modal */}
        <CreateContactModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          formData={newContact}
          onChange={handleInputChange}
          onSubmit={handleCreateContact}
          isSaving={isSaving}
        />
      </div>
    </PortalLayout>
  );
}

// Empty state component
function EmptyStateCard({ searchQuery }: { searchQuery: string }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery ? 'No matching contacts' : 'No contacts found'}
          </h3>
          <p className="mt-2 text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search query or filters.' 
              : 'Get started by adding your first customer contact.'}
          </p>
          {!searchQuery && (
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Contact card component
function ContactCard({ contact, onView }: { contact: Contact, onView: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium">
                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                <p className="text-xs text-gray-500">Customer #{contact.id}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <button onClick={onView} className="p-1 rounded-full hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-1 rounded-full hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex">
              <div className="w-5 h-5 mr-2 flex-shrink-0 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <span className="text-gray-700 truncate">{contact.phone || 'No phone'}</span>
            </div>
            
            <div className="flex">
              <div className="w-5 h-5 mr-2 flex-shrink-0 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <span className="text-gray-700 truncate">{contact.email || 'No email'}</span>
            </div>
            
            <div className="flex">
              <div className="w-5 h-5 mr-2 flex-shrink-0 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 truncate">
                {contact.address ? `${contact.address}, ${contact.city}, ${contact.state} ${contact.zip}` : 'No address'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs">
            <div>
              <span className="text-gray-500">Last Service:</span>
              <span className="ml-1 text-gray-700 font-medium">
                {contact.lastServiceDate ? new Date(contact.lastServiceDate).toLocaleDateString() : 'None'}
              </span>
            </div>
            <button className="text-emerald-600 hover:text-emerald-700 font-medium">Schedule</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Contact detail view component
// Contact detail view component is now imported from @/components/hvac/ContactDetailView
// This allows us to reuse and share the contact detail view logic across the application

// Create Contact Modal
function CreateContactModal({
  isOpen,
  onClose,
  formData,
  onChange,
  onSubmit,
  isSaving
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}) {
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
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Add New Contact</h3>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={onChange}
                required
                className="mt-1"
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onChange}
                  className="mt-1"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={onChange}
                  className="mt-1"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={onChange}
                className="mt-1"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={onChange}
                  className="mt-1"
                  placeholder="Anytown"
                />
              </div>
              <div>
                <Label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={onChange}
                  className="mt-1"
                  placeholder="CA"
                />
              </div>
              <div>
                <Label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP
                </Label>
                <Input
                  id="zip"
                  name="zip"
                  type="text"
                  value={formData.zip}
                  onChange={onChange}
                  className="mt-1"
                  placeholder="12345"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={onChange}
                className="mt-1"
                placeholder="Additional information about this contact..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-3 border-t border-gray-200">
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
                ) : 'Create Contact'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}