import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { getCompanyBySlug } from '@/lib/supabase-db';
import Link from 'next/link';
import { 
  Equipment, 
  EquipmentPhoto, 
  EquipmentFormData, 
  EquipmentView, 
  EquipmentSubTab,
  EQUIPMENT_TYPES,
  BRANDS,
  REFRIGERANTS
} from '@/types/atlashvac';
import {
  fetchEquipment,
  saveEquipment,
  deleteEquipment,
  fetchEquipmentPhotos,
  uploadEquipmentPhoto,
  deleteEquipmentPhoto,
  validatePhotoFile
} from '@/lib/atlashvac-equipment';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type?: 'Residential' | 'Commercial' | 'Industrial';
  created_at: string;
}

export default function AtlasHVACContacts() {
  const router = useRouter();
  const { company: companySlug } = router.query;
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'service'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Equipment tab state
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [equipmentView, setEquipmentView] = useState<EquipmentView>('list');
  const [equipmentSubTab, setEquipmentSubTab] = useState<EquipmentSubTab>('essentials');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentFormData>({
    equipment_type: 'Split AC',
    brand: '',
    model_number: '',
    serial_number: '',
    location_on_site: '',
    capacity_size: '',
    refrigerant: '',
    efficiency_rating: '',
    install_date: '',
    warranty_ends: ''
  });
  const [equipmentPhotos, setEquipmentPhotos] = useState<EquipmentPhoto[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (router.isReady && companySlug) {
      loadCompany();
    }
  }, [router.isReady, companySlug]);

  useEffect(() => {
    if (company) {
      loadContacts();
    }
  }, [company]);

  const loadCompany = async () => {
    try {
      if (!companySlug || typeof companySlug !== 'string') {
        setError('Invalid company slug');
        setLoading(false);
        return;
      }

      const companyData = await getCompanyBySlug(companySlug);
      
      if (!companyData) {
        setError(`Company not found: ${companySlug}`);
        setLoading(false);
        return;
      }

      setCompany(companyData);
      setError(null);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Failed to load company');
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!company) return;
    
    try {
      setLoading(true);
      setError(null);

      // Using atlashvac_contacts table
      const { data, error } = await supabase
        .from('atlashvac_contacts')
        .select('*')
        .eq('tenant_id', company.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Contacts table may not exist yet:', error);
        setContacts([]);
        return;
      }

      setContacts(data || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Equipment management functions
  const loadEquipment = async () => {
    if (!company || !selectedContact) return;
    
    try {
      setEquipmentLoading(true);
      const equipment = await fetchEquipment(company.id, selectedContact.id);
      setEquipmentList(equipment);
    } catch (err) {
      console.error('Error loading equipment:', err);
      setError('Failed to load equipment');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const loadEquipmentPhotos = async (equipmentId: string) => {
    if (!company) return;
    
    try {
      const photos = await fetchEquipmentPhotos(equipmentId, company.id);
      setEquipmentPhotos(photos);
    } catch (err) {
      console.error('Error loading equipment photos:', err);
      setError('Failed to load equipment photos');
    }
  };

  const handleEquipmentSave = async () => {
    if (!company || !selectedContact) return;
    
    try {
      setEquipmentLoading(true);
      const savedEquipment = await saveEquipment(
        equipmentForm,
        company.id,
        selectedContact.id,
        selectedEquipment?.id
      );
      
      // Refresh equipment list
      await loadEquipment();
      
      // Reset form and go back to list view
      resetEquipmentForm();
      setEquipmentView('list');
    } catch (err) {
      console.error('Error saving equipment:', err);
      setError('Failed to save equipment');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handleEquipmentDelete = async (equipmentId: string) => {
    if (!company || !confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
      setEquipmentLoading(true);
      await deleteEquipment(equipmentId, company.id);
      await loadEquipment();
      
      // If we're viewing the deleted equipment, go back to list
      if (selectedEquipment?.id === equipmentId) {
        setEquipmentView('list');
        setSelectedEquipment(null);
      }
    } catch (err) {
      console.error('Error deleting equipment:', err);
      setError('Failed to delete equipment');
    } finally {
      setEquipmentLoading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!company || !selectedEquipment || files.length === 0) return;
    
    try {
      setPhotoUploading(true);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validatePhotoFile(file);
        
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }
        
        await uploadEquipmentPhoto(file, selectedEquipment.id, company.id);
      }
      
      // Refresh photos
      await loadEquipmentPhotos(selectedEquipment.id);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError('Failed to upload photos');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!company || !confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await deleteEquipmentPhoto(photoId, company.id);
      
      // Refresh photos
      if (selectedEquipment) {
        await loadEquipmentPhotos(selectedEquipment.id);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo');
    }
  };

  const resetEquipmentForm = () => {
    setEquipmentForm({
      equipment_type: 'Split AC',
      brand: '',
      model_number: '',
      serial_number: '',
      location_on_site: '',
      capacity_size: '',
      refrigerant: '',
      efficiency_rating: '',
      install_date: '',
      warranty_ends: ''
    });
    setSelectedEquipment(null);
    setEquipmentPhotos([]);
    setEquipmentSubTab('essentials');
  };

  const handleAddEquipment = () => {
    resetEquipmentForm();
    setEquipmentView('details');
  };

  const handleEditEquipment = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEquipmentForm({
      equipment_type: equipment.equipment_type,
      brand: equipment.brand || '',
      model_number: equipment.model_number || '',
      serial_number: equipment.serial_number || '',
      location_on_site: equipment.location_on_site || '',
      capacity_size: equipment.capacity_size || '',
      refrigerant: equipment.refrigerant || '',
      efficiency_rating: equipment.efficiency_rating || '',
      install_date: equipment.install_date || '',
      warranty_ends: equipment.warranty_ends || ''
    });
    
    // Load photos for this equipment
    await loadEquipmentPhotos(equipment.id);
    setEquipmentView('details');
  };

  // Load equipment when contact is selected and equipment tab is active
  useEffect(() => {
    if (activeTab === 'equipment' && selectedContact && company) {
      loadEquipment();
    }
  }, [activeTab, selectedContact, company]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {company ? company.name : 'Atlas HVAC'}
              </h1>
              <p className="text-xs text-gray-500">Customer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg">
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0M8 5a2 2 0 000 4h8a2 2 0 000-4M8 5v0" />
            </svg>
            Dashboard
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </div>
          
          <Link href={`/atlashvac/${companySlug}/contacts`} className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Contacts
          </Link>
          
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg">
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </div>
          
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg">
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
            </svg>
            Schedule
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          {company && (
            <button
              onClick={() => window.open(`https://atlasgrowth.ai/t/moderntrust/${company.slug}`, '_blank')}
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Website
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-600 mt-1">{contacts.length} total customers</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search customers..."
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No customers yet</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by adding your first customer.</p>
              <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Add Customer
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts
                      .filter(contact => 
                        searchTerm === '' || 
                        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        contact.phone?.includes(searchTerm) ||
                        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        contact.address?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((contact) => (
                      <tr 
                        key={contact.id} 
                        className="hover:bg-gray-50 cursor-pointer" 
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowContactModal(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.phone || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.email || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.address || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(contact.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden space-y-4">
                {contacts
                  .filter(contact => 
                    searchTerm === '' || 
                    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.phone?.includes(searchTerm) ||
                    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((contact) => (
                  <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowContactModal(true);
                        }}
                        className="font-medium text-gray-900 text-left"
                      >
                        {contact.first_name} {contact.last_name}
                      </button>
                      <div className="flex items-center space-x-3">
                        {contact.phone && (
                          <button
                            onClick={() => window.open(`tel:${contact.phone}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        )}
                        {contact.phone && (
                          <button
                            onClick={() => window.open(`sms:${contact.phone}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        )}
                        {contact.email && (
                          <button
                            onClick={() => window.open(`mailto:${contact.email}`)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-full"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </button>
                        )}
                        {contact.address && (
                          <button
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`, '_blank')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {showContactModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedContact.first_name} {selectedContact.last_name}
              </h2>
              <button 
                onClick={() => {
                  setShowContactModal(false);
                  setActiveTab('overview');
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'equipment'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Equipment
                </button>
                <button
                  onClick={() => setActiveTab('service')}
                  className={`py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'service'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Service History
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                      {selectedContact.customer_type && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedContact.customer_type === 'Commercial' 
                            ? 'bg-blue-100 text-blue-800' 
                            : selectedContact.customer_type === 'Industrial'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedContact.customer_type === 'Commercial' && '🏢'} 
                          {selectedContact.customer_type === 'Industrial' && '🏭'} 
                          {selectedContact.customer_type === 'Residential' && '🏠'} 
                          {selectedContact.customer_type}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {selectedContact.phone && (
                          <div className="flex items-center space-x-3">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <button 
                                onClick={() => window.open(`tel:${selectedContact.phone}`)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {selectedContact.phone}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {selectedContact.email && (
                          <div className="flex items-center space-x-3">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <button 
                                onClick={() => window.open(`mailto:${selectedContact.email}`)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {selectedContact.email}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {selectedContact.address && (
                          <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <button 
                                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedContact.address)}`, '_blank')}
                                className="text-blue-600 hover:text-blue-800 font-medium text-left"
                              >
                                {selectedContact.address}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm text-gray-500">Customer since</p>
                          <p className="font-medium text-gray-900">{formatDate(selectedContact.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment Tab */}
              {activeTab === 'equipment' && (
                <div className="space-y-6">
                  {equipmentView === 'list' ? (
                    // Equipment List View
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Equipment</h3>
                        <button 
                          onClick={handleAddEquipment}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Equipment
                        </button>
                      </div>

                      {equipmentLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading equipment...</p>
                        </div>
                      ) : equipmentList.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No equipment yet</h3>
                          <p className="mt-2 text-sm text-gray-500">Get started by adding the first piece of equipment for this customer.</p>
                          <button 
                            onClick={handleAddEquipment}
                            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Add Equipment
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {equipmentList.map((equipment) => (
                            <div 
                              key={equipment.id}
                              onClick={() => handleEditEquipment(equipment)}
                              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{equipment.equipment_type}</h4>
                                  {equipment.brand && (
                                    <p className="text-sm text-gray-600 mt-1">{equipment.brand}</p>
                                  )}
                                  {equipment.location_on_site && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {equipment.location_on_site}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDelete(equipment.id);
                                  }}
                                  className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              
                              {equipment.install_date && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-500">
                                    Installed: {formatDate(equipment.install_date)}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Equipment Details View
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => setEquipmentView('list')}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedEquipment ? 'Edit Equipment' : 'Add Equipment'}
                          </h3>
                        </div>
                      </div>

                      {/* Equipment Sub-tabs */}
                      <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                          <button
                            onClick={() => setEquipmentSubTab('essentials')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              equipmentSubTab === 'essentials'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Essentials
                          </button>
                          <button
                            onClick={() => setEquipmentSubTab('technical')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              equipmentSubTab === 'technical'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Technical Specs
                          </button>
                          <button
                            onClick={() => setEquipmentSubTab('photos')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              equipmentSubTab === 'photos'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Photos
                          </button>
                        </nav>
                      </div>

                      {/* Essentials Sub-tab */}
                      {equipmentSubTab === 'essentials' && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Type *</label>
                              <select 
                                value={equipmentForm.equipment_type}
                                onChange={(e) => setEquipmentForm({...equipmentForm, equipment_type: e.target.value as any})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {EQUIPMENT_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                              <select 
                                value={equipmentForm.brand}
                                onChange={(e) => setEquipmentForm({...equipmentForm, brand: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select brand...</option>
                                {BRANDS.map((brand) => (
                                  <option key={brand} value={brand}>{brand}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Model Number</label>
                              <input 
                                type="text"
                                value={equipmentForm.model_number}
                                onChange={(e) => setEquipmentForm({...equipmentForm, model_number: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. XR13-036-230"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Location on Site</label>
                              <input 
                                type="text"
                                value={equipmentForm.location_on_site}
                                onChange={(e) => setEquipmentForm({...equipmentForm, location_on_site: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Backyard, Basement, Attic"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Install Date</label>
                              <input 
                                type="date"
                                value={equipmentForm.install_date}
                                onChange={(e) => setEquipmentForm({...equipmentForm, install_date: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => setEquipmentView('list')}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleEquipmentSave}
                              disabled={equipmentLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {equipmentLoading ? 'Saving...' : 'Save Equipment'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Technical Specs Sub-tab */}
                      {equipmentSubTab === 'technical' && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                              <input 
                                type="text"
                                value={equipmentForm.serial_number}
                                onChange={(e) => setEquipmentForm({...equipmentForm, serial_number: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Equipment serial number"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Capacity/Size</label>
                              <input 
                                type="text"
                                value={equipmentForm.capacity_size}
                                onChange={(e) => setEquipmentForm({...equipmentForm, capacity_size: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 3 ton, 36k BTU"
                              />
                              <p className="text-xs text-gray-500 mt-1">Tonnage or BTU capacity</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Refrigerant</label>
                              <select 
                                value={equipmentForm.refrigerant}
                                onChange={(e) => setEquipmentForm({...equipmentForm, refrigerant: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select refrigerant...</option>
                                {REFRIGERANTS.map((ref) => (
                                  <option key={ref} value={ref}>{ref}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency Rating</label>
                              <input 
                                type="text"
                                value={equipmentForm.efficiency_rating}
                                onChange={(e) => setEquipmentForm({...equipmentForm, efficiency_rating: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. 16 SEER, 95% AFUE"
                              />
                              <p className="text-xs text-gray-500 mt-1">SEER, AFUE, or other efficiency rating</p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Ends</label>
                              <input 
                                type="date"
                                value={equipmentForm.warranty_ends}
                                onChange={(e) => setEquipmentForm({...equipmentForm, warranty_ends: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Typically 10 years from install date</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => setEquipmentView('list')}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleEquipmentSave}
                              disabled={equipmentLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {equipmentLoading ? 'Saving...' : 'Save Equipment'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Photos Sub-tab */}
                      {equipmentSubTab === 'photos' && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                          {/* Photo Upload Area */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Equipment Photos</label>
                            <div 
                              onDrop={(e) => {
                                e.preventDefault();
                                const files = e.dataTransfer.files;
                                if (files.length > 0) handlePhotoUpload(files);
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                              onClick={() => document.getElementById('photo-upload')?.click()}
                            >
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-600">
                                {photoUploading ? 'Uploading...' : 'Drop photos here or click to browse'}
                              </p>
                              <p className="text-xs text-gray-500">JPEG, PNG, WebP up to 5MB each</p>
                              <input
                                id="photo-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handlePhotoUpload(e.target.files);
                                  }
                                }}
                                className="hidden"
                              />
                            </div>
                          </div>

                          {/* Photo Grid */}
                          {equipmentPhotos.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Photos</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {equipmentPhotos.map((photo) => (
                                  <div key={photo.id} className="relative group">
                                    <img 
                                      src={photo.photo_url} 
                                      alt="Equipment photo" 
                                      className="w-full h-24 object-cover rounded-md border border-gray-200"
                                    />
                                    <button
                                      onClick={() => handlePhotoDelete(photo.id)}
                                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => setEquipmentView('list')}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              Back to List
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Service History Tab */}
              {activeTab === 'service' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
                  </div>
                  
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No service history yet</h3>
                    <p className="mt-2 text-sm text-gray-500">Service calls and maintenance records will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}