import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import TenantLayout from '../../components/tenant/TenantLayout';
import { ThemeProvider } from '../../components/tenant/ThemeProvider';
import { supabase } from '../../lib/supabase';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PhoneIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  equip_type: string;
  warranty_expiry: string;
  created_at: string;
};

type Props = {
  contacts: Contact[];
  error?: string;
};

const EQUIPMENT_TYPES = [
  { value: '', label: 'All Equipment' },
  { value: 'central_ac', label: 'Central AC' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'furnace', label: 'Furnace' },
  { value: 'mini_split', label: 'Mini Split' },
];

export default function ContactsList({ contacts: initialContacts, error }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState(false);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEquip = !equipFilter || contact.equip_type === equipFilter;
    
    const matchesWarranty = !warrantyFilter || (
      contact.warranty_expiry && 
      new Date(contact.warranty_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );

    return matchesSearch && matchesEquip && matchesWarranty;
  });

  const formatEquipmentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <ThemeProvider>
        <TenantLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Contacts</h1>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        </TenantLayout>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <TenantLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Manage your customer contacts and equipment information
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/contacts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Contact
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Equipment filter */}
              <div>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={equipFilter}
                  onChange={(e) => setEquipFilter(e.target.value)}
                >
                  {EQUIPMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warranty filter */}
              <div className="flex items-center">
                <input
                  id="warranty-filter"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  checked={warrantyFilter}
                  onChange={(e) => setWarrantyFilter(e.target.checked)}
                />
                <label htmlFor="warranty-filter" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Warranty expiring (90d)
                </label>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </p>
          </div>

          {/* Contacts list */}
          <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No contacts found</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm || equipFilter || warrantyFilter 
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first contact'
                  }
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContacts.map((contact) => (
                  <li key={contact.id}>
                    <Link 
                      href={`/contacts/${contact.id}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {contact.first_name} {contact.last_name}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  {contact.phone && (
                                    <div className="flex items-center">
                                      <PhoneIcon className="h-4 w-4 mr-1" />
                                      {contact.phone}
                                    </div>
                                  )}
                                  {contact.email && (
                                    <div className="flex items-center">
                                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                                      {contact.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {contact.equip_type && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {formatEquipmentType(contact.equip_type)}
                              </span>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Added {formatDate(contact.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </TenantLayout>
    </ThemeProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // For dev, hardcode tenant_id - in production this would come from JWT
    const DEV_TENANT_ID = process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000000';
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, email, equip_type, warranty_expiry, created_at')
      .eq('tenant_id', DEV_TENANT_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return {
        props: {
          contacts: [],
          error: `Database error: ${error.message}. Make sure to run the Phase 1 migrations first.`
        }
      };
    }

    return {
      props: {
        contacts: contacts || []
      }
    };
  } catch (err) {
    console.error('Server error:', err);
    return {
      props: {
        contacts: [],
        error: 'Failed to load contacts. Please check database connection.'
      }
    };
  }
};