'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  street: string | null;
  city: string | null;
  notes: string | null;
}

interface Equipment {
  id: string;
  type: string | null;
  brand: string | null;
  model: string | null;
  install_year: number | null;
  serial: string | null;
}

interface Job {
  id: string;
  service_type: string;
  status: 'NEW' | 'SCHEDULED' | 'PROGRESS' | 'DONE';
  priority: 'normal' | 'emergency';
  scheduled_at: string | null;
  notes: string | null;
}

export default function ContactsPage({ params }: { params: { slug: string } }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactEquipment, setContactEquipment] = useState<Equipment[]>([]);
  const [contactJobs, setContactJobs] = useState<Job[]>([]);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [showAddEquipmentDrawer, setShowAddEquipmentDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEquipment, setNewEquipment] = useState({
    brand: '',
    model: '',
    type: 'ac',
    install_year: new Date().getFullYear(),
    serial: '',
  });
  
  // Function to load contacts
  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/company/contacts?slug=${params.slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to load contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load contacts on component mount
  useEffect(() => {
    loadContacts();
  }, [params.slug]);
  
  // Function to load contact details (equipment and jobs)
  const loadContactDetails = async (contactId: string) => {
    try {
      const response = await fetch(`/api/company/contact-details?contactId=${contactId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load contact details');
      }
      
      const data = await response.json();
      setContactEquipment(data.equipment || []);
      setContactJobs(data.jobs || []);
    } catch (err) {
      console.error('Error loading contact details:', err);
    }
  };
  
  // Function to add new equipment
  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact) return;
    
    try {
      const response = await fetch('/api/company/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySlug: params.slug,
          contactId: selectedContact.id,
          ...newEquipment,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add equipment');
      }
      
      // Refresh equipment list
      loadContactDetails(selectedContact.id);
      
      // Reset form and close drawer
      setNewEquipment({
        brand: '',
        model: '',
        type: 'ac',
        install_year: new Date().getFullYear(),
        serial: '',
      });
      setShowAddEquipmentDrawer(false);
    } catch (error) {
      console.error('Error adding equipment:', error);
    }
  };
  
  // Handle contact selection to view details
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    loadContactDetails(contact.id);
    setShowContactDrawer(true);
  };
  
  // Format phone number for display
  const formatPhone = (phone: string) => {
    // Remove non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
    
    return phone;
  };
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower))
    );
  });
  
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={loadContacts}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {contacts.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No contacts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Contacts will appear here when you convert messages or add them manually.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectContact(contact)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatPhone(contact.phone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {contact.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(contact);
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Contact Details Drawer */}
      {showContactDrawer && selectedContact && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowContactDrawer(false)}
            ></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="relative w-full max-w-md">
                <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedContact.name}
                      </h2>
                      <button
                        type="button"
                        className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setShowContactDrawer(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          <a
                            href={`tel:${selectedContact.phone}`}
                            className="text-primary hover:underline"
                          >
                            {formatPhone(selectedContact.phone)}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedContact.email ? (
                            <a
                              href={`mailto:${selectedContact.email}`}
                              className="text-primary hover:underline"
                            >
                              {selectedContact.email}
                            </a>
                          ) : (
                            '-'
                          )}
                        </dd>
                      </div>
                      {(selectedContact.street || selectedContact.city) && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Address
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedContact.street && <p>{selectedContact.street}</p>}
                            {selectedContact.city && <p>{selectedContact.city}</p>}
                          </dd>
                        </div>
                      )}
                      
                      {selectedContact.notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Notes
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {selectedContact.notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  
                  {/* Equipment Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Equipment
                      </h3>
                      <button
                        onClick={() => setShowAddEquipmentDrawer(true)}
                        className="bg-primary text-white px-3 py-1.5 text-sm rounded hover:bg-primary/90 transition-colors"
                      >
                        + Add Equipment
                      </button>
                    </div>
                    
                    {contactEquipment.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No equipment recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {contactEquipment.map((equipment) => (
                          <div
                            key={equipment.id}
                            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">
                                {equipment.type || 'Equipment'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {equipment.install_year || ''}
                              </div>
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">
                                Brand:
                              </span>{' '}
                              {equipment.brand || '-'}
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">
                                Model:
                              </span>{' '}
                              {equipment.model || '-'}
                            </div>
                            {equipment.serial && (
                              <div className="mt-1 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Serial:
                                </span>{' '}
                                {equipment.serial}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Recent Jobs Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Recent Jobs
                    </h3>
                    
                    {contactJobs.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No jobs recorded yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {contactJobs.slice(0, 3).map((job) => (
                          <div
                            key={job.id}
                            className="border border-gray-200 dark:border-gray-700 p-3 rounded-md"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">
                                {job.service_type || 'Service'}
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded ${
                                  job.status === 'NEW'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                    : job.status === 'SCHEDULED'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                    : job.status === 'PROGRESS'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                }`}
                              >
                                {job.status}
                              </div>
                            </div>
                            {job.scheduled_at && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Scheduled:
                                </span>{' '}
                                {new Date(job.scheduled_at).toLocaleString()}
                              </div>
                            )}
                            {job.priority === 'emergency' && (
                              <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                                Emergency
                              </div>
                            )}
                            {job.notes && (
                              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {job.notes}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {contactJobs.length > 3 && (
                          <Link
                            href={`/${params.slug}/portal/schedule?contactId=${selectedContact.id}`}
                            className="block text-center text-sm text-primary hover:underline"
                          >
                            View all {contactJobs.length} jobs
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Equipment Drawer */}
      {showAddEquipmentDrawer && selectedContact && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddEquipmentDrawer(false)}
            ></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="relative w-full max-w-md">
                <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
                  <div className="px-4 py-6 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Add Equipment
                      </h2>
                      <button
                        type="button"
                        className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setShowAddEquipmentDrawer(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleAddEquipment} className="px-4 sm:px-6 pb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Equipment Type
                        </label>
                        <select
                          value={newEquipment.type}
                          onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="ac">Air Conditioner</option>
                          <option value="furnace">Furnace</option>
                          <option value="heat_pump">Heat Pump</option>
                          <option value="boiler">Boiler</option>
                          <option value="mini_split">Mini Split</option>
                          <option value="thermostat">Thermostat</option>
                          <option value="air_handler">Air Handler</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Brand*
                        </label>
                        <input
                          type="text"
                          required
                          value={newEquipment.brand}
                          onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Carrier, Trane, etc."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Model*
                        </label>
                        <input
                          type="text"
                          required
                          value={newEquipment.model}
                          onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Install Year
                        </label>
                        <input
                          type="number"
                          min="1970"
                          max={new Date().getFullYear()}
                          value={newEquipment.install_year}
                          onChange={(e) => setNewEquipment({ ...newEquipment, install_year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          value={newEquipment.serial}
                          onChange={(e) => setNewEquipment({ ...newEquipment, serial: e.target.value })}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddEquipmentDrawer(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        Add Equipment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}