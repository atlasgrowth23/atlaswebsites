import React from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/types/contact';

interface ContactDetailsProps {
  contact: Contact;
  onClose: () => void;
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
}

export function ContactDetails({
  contact,
  onClose,
  formatDate,
  getInitials
}: ContactDetailsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-600">
              {getInitials(contact.name)}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">{contact.name}</h2>
              <p className="text-sm text-gray-500">Customer since {formatDate(contact.customer_since)}</p>
            </div>
          </div>
          <div className="lg:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-3 px-6 mb-4">
          <Button variant="outline" size="sm" className="text-gray-700 h-9">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" size="sm" className="text-gray-700 h-9">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="text-gray-700 h-9">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Phone</div>
                <div className="mt-1 flex items-center">
                  <a href={`tel:${contact.phone}`} className="text-gray-900 hover:text-blue-600">
                    {contact.phone}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="mt-1">
                  <a href={`mailto:${contact.email}`} className="text-gray-900 hover:text-blue-600">
                    {contact.email}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Address</div>
                <div className="mt-1">
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-blue-600 flex items-start"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-gray-400" />
                    <span>{contact.address}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Other details */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-4">Other Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Type</div>
                <div className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {contact.type}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Customer Since</div>
                <div className="mt-1 text-gray-900">
                  {formatDate(contact.customer_since)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}