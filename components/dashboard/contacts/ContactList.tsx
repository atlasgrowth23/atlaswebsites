import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Search, Plus } from 'lucide-react';

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

interface ContactListProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelectContact: (contact: Contact) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddContact: () => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedContactId,
  onSelectContact,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddContact
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Contacts</h3>
          <Button size="sm" onClick={onAddContact}>
            <Plus className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No contacts found</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {contacts.map(contact => (
              <li key={contact.id}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start p-3 ${selectedContactId === contact.id ? 'bg-blue-50' : ''}`}
                  onClick={() => onSelectContact(contact)}
                >
                  <div className="mr-3">
                    <Avatar className="h-10 w-10">
                      <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </Avatar>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </div>
                  {contact.equipment.length > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      {contact.equipment.length} items
                    </Badge>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ContactList;