import React from 'react';
import {
  Phone,
  Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/types/contact';

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  onSelectContact: (id: string) => void;
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
}

export function ContactTable({
  contacts,
  loading,
  onSelectContact,
  formatDate,
  getInitials
}: ContactTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-4">Contact</div>
            <div className="col-span-5 sm:col-span-5">Contact Info</div>
            <div className="col-span-3 sm:col-span-3">Type</div>
          </div>
          
          {/* Table body */}
          <div className="divide-y divide-gray-200 bg-white">
            {contacts.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                No contacts found matching your search.
              </div>
            ) : (
              contacts.map(contact => (
                <div
                  key={contact.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectContact(contact.id)}
                >
                  <div className="col-span-4 sm:col-span-4 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
                      {getInitials(contact.name)}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">Since {formatDate(contact.customer_since)}</div>
                    </div>
                  </div>
                  <div className="col-span-5 sm:col-span-5">
                    <div className="flex items-center text-sm text-gray-700">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {contact.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-700 mt-1">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {contact.email}
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 flex items-center">
                    <Badge variant="outline" className="capitalize">
                      {contact.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}