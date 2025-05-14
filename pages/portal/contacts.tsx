import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  lastContact: string;
  equipmentCount: number;
}

interface Equipment {
  id: number;
  type: string;
  brand: string;
  model: string;
  installDate: string;
}

interface Job {
  id: number;
  date: string;
  type: string;
  status: string;
  notes: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    brand: '',
    model: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock contacts data
    const mockContacts: Contact[] = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Springfield, IL',
        lastContact: '2025-05-10',
        equipmentCount: 2
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Springfield, IL',
        lastContact: '2025-05-12',
        equipmentCount: 1
      },
      {
        id: 3,
        name: 'Michael Brown',
        email: 'mbrown@example.com',
        phone: '(555) 456-7890',
        address: '789 Pine St, Springfield, IL',
        lastContact: '2025-05-08',
        equipmentCount: 3
      },
      {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        phone: '(555) 234-5678',
        address: '321 Maple Dr, Springfield, IL',
        lastContact: '2025-05-13',
        equipmentCount: 1
      }
    ];
    
    setContacts(mockContacts);
    setLoading(false);
  }, []);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    
    // Reset states
    setShowAddEquipment(false);
    
    // Fetch equipment and jobs for this contact
    fetchContactDetails(contact.id);
  };

  const fetchContactDetails = (contactId: number) => {
    // Mock equipment data
    const mockEquipment: Equipment[] = [
      {
        id: 1,
        type: 'Air Conditioner',
        brand: 'Carrier',
        model: 'Comfort 14 SEER',
        installDate: '2022-06-15'
      },
      {
        id: 2,
        type: 'Furnace',
        brand: 'Trane',
        model: 'XC95m',
        installDate: '2021-10-08'
      }
    ];
    
    // Mock jobs data
    const mockJobs: Job[] = [
      {
        id: 101,
        date: '2025-04-15',
        type: 'Maintenance',
        status: 'Completed',
        notes: 'Annual maintenance check. Replaced air filter.'
      },
      {
        id: 102,
        date: '2025-03-02',
        type: 'Repair',
        status: 'Completed',
        notes: 'Fixed refrigerant leak.'
      },
      {
        id: 103,
        date: '2025-05-20',
        type: 'Installation',
        status: 'Scheduled',
        notes: 'New thermostat installation.'
      }
    ];
    
    setEquipment(mockEquipment);
    setJobs(mockJobs);
  };

  const handleAddEquipment = () => {
    if (!newEquipment.brand || !newEquipment.model) return;
    
    alert(`Added new equipment: ${newEquipment.brand} ${newEquipment.model}`);
    
    // In a real app, you would make an API call here
    setNewEquipment({ brand: '', model: '' });
    setShowAddEquipment(false);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <PortalLayout title="Contacts" activeTab="contacts">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Contacts</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search contacts..."
              className="border px-3 py-1 rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="bg-blue-600 text-white px-3 py-1 rounded">
              + Add Contact
            </button>
          </div>
        </div>
        
        <div className="flex h-[calc(100vh-16rem)]">
          {/* Contact List */}
          <div className="w-1/3 border-r overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
              </div>
            ) : (
              <ul>
                {filteredContacts.map(contact => (
                  <li 
                    key={contact.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                    <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Contact Details */}
          <div className="w-2/3 overflow-y-auto">
            {selectedContact ? (
              <div className="p-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{selectedContact.name}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{selectedContact.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{selectedContact.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Address</p>
                      <p>{selectedContact.address}</p>
                    </div>
                  </div>
                </div>
                
                {/* Equipment Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">Equipment</h4>
                    <button 
                      onClick={() => setShowAddEquipment(!showAddEquipment)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      + Add Equipment
                    </button>
                  </div>
                  
                  {showAddEquipment && (
                    <div className="p-3 border rounded-md mb-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm mb-1">Brand</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-1"
                            value={newEquipment.brand}
                            onChange={(e) => setNewEquipment({...newEquipment, brand: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Model</label>
                          <input 
                            type="text" 
                            className="w-full border rounded p-1"
                            value={newEquipment.model}
                            onChange={(e) => setNewEquipment({...newEquipment, model: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => setShowAddEquipment(false)}
                          className="px-3 py-1 text-sm border rounded"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddEquipment}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                          disabled={!newEquipment.brand || !newEquipment.model}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Type</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Brand</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Model</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Install Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {equipment.map(item => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm">{item.type}</td>
                            <td className="px-3 py-2 text-sm">{item.brand}</td>
                            <td className="px-3 py-2 text-sm">{item.model}</td>
                            <td className="px-3 py-2 text-sm">{formatDate(item.installDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Recent Jobs Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">Recent Jobs</h4>
                    <button className="text-sm text-blue-600 hover:underline">
                      + Schedule Job
                    </button>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Date</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Type</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Status</th>
                          <th className="px-3 py-2 text-left text-sm text-gray-700">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {jobs.map(job => (
                          <tr key={job.id}>
                            <td className="px-3 py-2 text-sm">{formatDate(job.date)}</td>
                            <td className="px-3 py-2 text-sm">{job.type}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                job.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm">{job.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a contact to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}