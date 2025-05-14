import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/dashboard/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import ContactList from '@/components/dashboard/contacts/ContactList';
import ContactDetails from '@/components/dashboard/contacts/ContactDetails';
import ContactForm from '@/components/dashboard/contacts/ContactForm';

// Types for the equipment
interface Equipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  install_year: number;
  serial: string;
}

// Types for contacts
interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes: string;
  equipment: Equipment[];
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  
  // Mocked data for demonstration - this would be replaced with an API call
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const mockContacts: Contact[] = [
        {
          id: '1',
          name: 'John Smith',
          phone: '(555) 123-4567',
          email: 'john.smith@example.com',
          street: '123 Main St',
          city: 'Anytown, CA 95012',
          notes: 'Prefers afternoon appointments. Has a large dog in the backyard.',
          equipment: [
            {
              id: '101',
              type: 'Air Conditioner',
              brand: 'Carrier',
              model: 'Infinity 26',
              install_year: 2020,
              serial: 'CA12345678'
            },
            {
              id: '102',
              type: 'Furnace',
              brand: 'Trane',
              model: 'XC95m',
              install_year: 2019,
              serial: 'TR98765432'
            }
          ]
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'sarah.j@example.com',
          street: '456 Oak Ave',
          city: 'Springfield, IL 62701',
          notes: 'Has a maintenance contract. Front door code: 1234#',
          equipment: [
            {
              id: '201',
              type: 'Heat Pump',
              brand: 'Lennox',
              model: 'XP25',
              install_year: 2021,
              serial: 'LX87654321'
            }
          ]
        },
        {
          id: '3',
          name: 'David Wilson',
          phone: '(555) 456-7890',
          email: 'dwilson@example.com',
          street: '789 Pine St',
          city: 'Lakeside, MI 49456',
          notes: 'Recent water damage in basement.',
          equipment: [
            {
              id: '301',
              type: 'Furnace',
              brand: 'Rheem',
              model: 'R96V',
              install_year: 2018,
              serial: 'RH56781234'
            },
            {
              id: '302',
              type: 'Thermostat',
              brand: 'Nest',
              model: 'Learning Thermostat (3rd Gen)',
              install_year: 2020,
              serial: 'NT44556677'
            }
          ]
        }
      ];
      
      setContacts(mockContacts);
      setSelectedContact(mockContacts[0]);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );
  
  // Handle selecting a contact
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Handle adding a new contact
  const handleAddContact = () => {
    setEditContact(null);
    setShowContactForm(true);
  };

  // Handle editing an existing contact
  const handleEditContact = (contact: Contact) => {
    setEditContact(contact);
    setShowContactForm(true);
  };

  // Handle saving a contact (new or edited)
  const handleSaveContact = (contactData: Partial<Contact>) => {
    if (editContact) {
      // Update existing contact
      const updatedContacts = contacts.map(c => 
        c.id === editContact.id ? { ...c, ...contactData } : c
      );
      setContacts(updatedContacts);
      setSelectedContact({ ...editContact, ...contactData });
    } else {
      // Add new contact
      const newContact: Contact = {
        id: `new-${Date.now()}`,
        name: contactData.name || '',
        phone: contactData.phone || '',
        email: contactData.email || '',
        street: contactData.street || '',
        city: contactData.city || '',
        notes: contactData.notes || '',
        equipment: []
      };
      
      setContacts([...contacts, newContact]);
      setSelectedContact(newContact);
    }
  };

  // Handle adding equipment to a contact
  const handleAddEquipment = (contactId: string) => {
    // This would typically open an equipment form modal
    console.log('Add equipment for contact:', contactId);
  };
  
  return (
    <DashboardLayout title="Contacts & Equipment">
      <Head>
        <title>Contacts & Equipment | HVAC Dashboard</title>
      </Head>
      
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 h-[calc(100vh-180px)]">
        {/* Sidebar with contact list */}
        <div className="w-full md:w-1/3">
          <Card className="h-full p-4">
            <ContactList 
              contacts={filteredContacts}
              selectedContactId={selectedContact?.id || null}
              onSelectContact={handleContactSelect}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddContact={handleAddContact}
            />
          </Card>
        </div>
        
        {/* Main content area for contact details */}
        <div className="w-full md:w-2/3">
          <Card className="h-full p-4">
            <ContactDetails 
              contact={selectedContact}
              onEditContact={handleEditContact}
              onAddEquipment={handleAddEquipment}
            />
          </Card>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactForm 
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onSave={handleSaveContact}
        initialData={editContact || {}}
        title={editContact ? 'Edit Contact' : 'Add New Contact'}
      />
    </DashboardLayout>
  );
}