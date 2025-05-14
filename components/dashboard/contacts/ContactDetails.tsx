import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Edit2, Settings, Info } from 'lucide-react';
import ContactEquipmentList from './ContactEquipmentList';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes: string;
  equipment: any[];
}

interface ContactDetailsProps {
  contact: Contact | null;
  onEditContact: (contact: Contact) => void;
  onAddEquipment: (contactId: string) => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  contact,
  onEditContact,
  onAddEquipment
}) => {
  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center py-10 px-4">
          <p className="text-lg font-medium">No contact selected</p>
          <p className="text-gray-500">Select a contact from the list to view details</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="details" className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">{contact.name}</h2>
          <p className="text-gray-500">{contact.city}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEditContact(contact)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            More
          </Button>
        </div>
      </div>
      
      <TabsList className="mb-4">
        <TabsTrigger value="details">Contact Details</TabsTrigger>
        <TabsTrigger value="equipment">Equipment ({contact.equipment.length})</TabsTrigger>
      </TabsList>
      
      <div className="flex-grow overflow-auto">
        <TabsContent value="details" className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p>{contact.phone}</p>
                    <p className="text-xs text-gray-500">Primary</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p>{contact.email}</p>
                    <p className="text-xs text-gray-500">Primary</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p>{contact.street}</p>
                    <p>{contact.city}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="p-3 bg-gray-50 rounded-md min-h-[120px]">
                {contact.notes || 'No notes added yet.'}
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <Settings className="h-4 w-4 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Maintenance Visit</p>
                    <p className="text-xs text-gray-500">May 5, 2025</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Mail className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email Sent</p>
                    <p className="text-xs text-gray-500">Apr 28, 2025</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="equipment" className="h-full">
          <ContactEquipmentList 
            equipment={contact.equipment} 
            onAddEquipment={() => onAddEquipment(contact.id)} 
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ContactDetails;