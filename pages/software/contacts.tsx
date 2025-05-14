import React, { useState, useEffect } from 'react';
import Layout from '@/components/software/Layout';
import ProtectedRoute from '@/components/software/ProtectedRoute';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  lastContact: string;
}

interface Equipment {
  id: number;
  type: string;
  brand: string;
  model: string;
  installDate: string;
}

interface ServiceRecord {
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
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    brand: '',
    model: '',
    type: 'Air Conditioner'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Fetch contacts (simulated)
    const fetchContacts = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const mockContacts: Contact[] = [
        {
          id: 1,
          name: 'John Smith',
          phone: '(555) 123-4567',
          email: 'john.smith@example.com',
          address: '123 Main St, Springfield, IL',
          lastContact: '2025-05-10'
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'sarah.j@example.com',
          address: '456 Oak Ave, Springfield, IL',
          lastContact: '2025-05-12'
        },
        {
          id: 3,
          name: 'Michael Brown',
          phone: '(555) 456-7890',
          email: 'mbrown@example.com',
          address: '789 Pine St, Springfield, IL',
          lastContact: '2025-05-08'
        },
        {
          id: 4,
          name: 'Emily Davis',
          phone: '(555) 234-5678',
          email: 'emily.davis@example.com',
          address: '321 Maple Dr, Springfield, IL',
          lastContact: '2025-05-13'
        }
      ];
      
      setContacts(mockContacts);
      setLoading(false);
    };
    
    fetchContacts();
  }, []);
  
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowAddEquipment(false);
    fetchContactDetails(contact.id);
  };
  
  const fetchContactDetails = async (contactId: number) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
    
    // Mock service records
    const mockServiceRecords: ServiceRecord[] = [
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
    setServiceRecords(mockServiceRecords);
  };
  
  const handleAddEquipment = () => {
    if (!newEquipment.brand || !newEquipment.model) return;
    
    // In a real app, would call API
    alert(`Added new equipment: ${newEquipment.type} - ${newEquipment.brand} ${newEquipment.model}`);
    
    setNewEquipment({ brand: '', model: '', type: 'Air Conditioner' });
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
    <ProtectedRoute>
      <Layout title="Contacts">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Contacts</h2>
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
        
        <div className="bg-white rounded-lg shadow overflow-hidden flex h-[calc(100vh-14rem)]">
          {/* Contact List */}
          <div className="w-1/3 border-r">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No contacts found
                  </div>
                ) : (
                  <ul>
                    {filteredContacts.map(contact => (
                      <li 
                        key={contact.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
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
            )}
          </div>
          
          {/* Contact Details */}
          <div className="flex-1 overflow-y-auto">
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
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Last Contact</p>
                      <p>{formatDate(selectedContact.lastContact)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Equipment Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg">Equipment</h4>
                    <button 
                      onClick={() => setShowAddEquipment(!showAddEquipment)}
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      {showAddEquipment ? 'Cancel' : '+ Add Equipment'}
                    </button>
                  </div>
                  
                  {showAddEquipment && (
                    <div className="p-3 border rounded-md mb-3 bg-gray-50">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-sm mb-1">Type</label>
                          <select 
                            className="w-full border rounded p-1"
                            value={newEquipment.type}
                            onChange={(e) => setNewEquipment({...newEquipment, type: e.target.value})}
                          >
                            <option value="Air Conditioner">Air Conditioner</option>
                            <option value="Furnace">Furnace</option>
                            <option value="Heat Pump">Heat Pump</option>
                            <option value="Thermostat">Thermostat</option>
                          </select>
                        </div>
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
                      <div className="flex justify-end">
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
                        {equipment.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-sm text-center text-gray-500">
                              No equipment found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Service Records Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg">Service Records</h4>
                    <button className="text-sm text-blue-600 hover:underline flex items-center">
                      + Schedule Service
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
                        {serviceRecords.map(record => (
                          <tr key={record.id}>
                            <td className="px-3 py-2 text-sm">{formatDate(record.date)}</td>
                            <td className="px-3 py-2 text-sm">{record.type}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                record.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm truncate max-w-[200px]" title={record.notes}>
                              {record.notes}
                            </td>
                          </tr>
                        ))}
                        {serviceRecords.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-sm text-center text-gray-500">
                              No service records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Select a contact to view details</p>
                <p className="text-sm mt-2">Or create a new contact</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}