import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import TenantLayout from '../../components/tenant/TenantLayout';
import { ThemeProvider } from '../../components/tenant/ThemeProvider';
import VoiceMicButton from '../../components/tenant/VoiceMicButton';
import GoogleAddressInput from '../../components/tenant/GoogleAddressInput';
import FormattedInput from '../../components/tenant/FormattedInput';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

type Contact = {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: any;
  lat?: number;
  lng?: number;
  equip_type: string;
  model_number: string;
  serial_number: string;
  install_date: string;
  filter_size: string;
  warranty_expiry: string;
  unit_photo_url: string;
  notes: string;
  vertical_fields: any;
  created_at: string;
  updated_at: string;
};

type Props = {
  contact: Contact | null;
  error?: string;
};

const TABS = [
  { id: 'info', name: 'Info' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'notes', name: 'Notes' },
  { id: 'photos', name: 'Photos' },
];

const EQUIPMENT_TYPES = [
  { value: 'central_ac', label: 'Central AC' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'furnace', label: 'Furnace' },
  { value: 'mini_split', label: 'Mini Split' },
];

export default function ContactDetail({ contact: initialContact, error }: Props) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(initialContact);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  useEffect(() => {
    if (contact) {
      setEditForm(contact);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact || !editForm) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update(editForm)
        .eq('id', contact.id);

      if (error) throw error;

      setContact({ ...contact, ...editForm });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating contact:', err);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    const currentNotes = editForm.notes || '';
    const newNotes = currentNotes ? `${currentNotes} ${transcript}` : transcript;
    setEditForm(prev => ({ ...prev, notes: newNotes }));
  };

  const handleFieldVoiceInput = (field: string) => (transcript: string) => {
    setEditForm(prev => ({ ...prev, [field]: transcript }));
  };

  const handleAddressChange = (address: any) => {
    setEditForm(prev => ({ 
      ...prev, 
      address,
      lat: address.lat,
      lng: address.lng
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEquipmentType = (type: string) => {
    if (!type) return 'Not specified';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (error) {
    return (
      <ThemeProvider>
        <TenantLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Contact</h1>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={() => router.push('/contacts')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Contacts
              </button>
            </div>
          </div>
        </TenantLayout>
      </ThemeProvider>
    );
  }

  if (!contact) {
    return (
      <ThemeProvider>
        <TenantLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Not Found</h1>
              <button
                onClick={() => router.push('/contacts')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Contacts
              </button>
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
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/contacts')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {contact.first_name} {contact.last_name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customer since {formatDate(contact.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'info' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.first_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contact.first_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.last_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contact.last_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </label>
                      {isEditing ? (
                        <FormattedInput
                          type="phone"
                          value={editForm.phone || ''}
                          onChange={(value) => setEditForm(prev => ({ ...prev, phone: value }))}
                          showVoiceInput={false}
                          className="mt-1"
                        />
                      ) : (
                        <div className="mt-1 flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{contact.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="mt-1 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{contact.email || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Address
                      </label>
                      {isEditing ? (
                        <div className="mt-1">
                          <GoogleAddressInput
                            value={editForm.address}
                            onChange={handleAddressChange}
                            placeholder="Enter customer address..."
                          />
                        </div>
                      ) : (
                        <div className="mt-1">
                          {contact.address?.formatted ? (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-900 dark:text-white">{contact.address.formatted}</p>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address.formatted)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                              >
                                Directions
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No address provided</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Equipment Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Equipment Type
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.equip_type || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, equip_type: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select equipment type</option>
                          {EQUIPMENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatEquipmentType(contact.equip_type)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Model Number
                      </label>
                      {isEditing ? (
                        <FormattedInput
                          type="model"
                          value={editForm.model_number || ''}
                          onChange={(value) => setEditForm(prev => ({ ...prev, model_number: value }))}
                          onVoiceTranscript={handleFieldVoiceInput('model_number')}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contact.model_number || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Serial Number
                      </label>
                      {isEditing ? (
                        <FormattedInput
                          type="serial"
                          value={editForm.serial_number || ''}
                          onChange={(value) => setEditForm(prev => ({ ...prev, serial_number: value }))}
                          onVoiceTranscript={handleFieldVoiceInput('serial_number')}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contact.serial_number || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Install Date
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.install_date || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, install_date: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="mt-1 flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{formatDate(contact.install_date)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter Size
                      </label>
                      {isEditing ? (
                        <FormattedInput
                          type="filter"
                          value={editForm.filter_size || ''}
                          onChange={(value) => setEditForm(prev => ({ ...prev, filter_size: value }))}
                          onVoiceTranscript={handleFieldVoiceInput('filter_size')}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contact.filter_size || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Warranty Expiry
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.warranty_expiry || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, warranty_expiry: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="mt-1 flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{formatDate(contact.warranty_expiry)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Notes
                    </h3>
                    {isEditing && (
                      <VoiceMicButton 
                        onTranscript={handleVoiceTranscript}
                        field="notes"
                        className="ml-4"
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={8}
                      className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Add notes about this customer, equipment issues, preferences, etc..."
                    />
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      {contact.notes ? (
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{contact.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No notes added yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    Photos
                  </h3>
                  <div className="text-center py-12">
                    <CameraIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Photo uploads coming soon</h4>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Equipment photos will be available in a future update
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </TenantLayout>
    </ThemeProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const contactId = params?.id as string;
    
    if (!contactId) {
      return {
        props: {
          contact: null,
          error: 'Contact ID not provided'
        }
      };
    }

    // For dev, hardcode tenant_id - in production this would come from JWT
    const DEV_TENANT_ID = process.env.DEV_TENANT_ID || '00000000-0000-0000-0000-000000000000';
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('tenant_id', DEV_TENANT_ID)
      .single();

    if (error) {
      console.error('Error fetching contact:', error);
      return {
        props: {
          contact: null,
          error: `Contact not found: ${error.message}`
        }
      };
    }

    return {
      props: {
        contact: contact || null
      }
    };
  } catch (err) {
    console.error('Server error:', err);
    return {
      props: {
        contact: null,
        error: 'Failed to load contact. Please check database connection.'
      }
    };
  }
};