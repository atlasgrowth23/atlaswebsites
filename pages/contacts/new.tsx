import { useState } from 'react';
import { useRouter } from 'next/router';
import TenantLayout from '../../components/tenant/TenantLayout';
import { ThemeProvider } from '../../components/tenant/ThemeProvider';
import GoogleAddressInput from '../../components/tenant/GoogleAddressInput';
import { supabase } from '../../lib/supabase';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewContact() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: null,
    lat: null,
    lng: null,
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddressChange = (address: any) => {
    setFormData(prev => ({ 
      ...prev, 
      address,
      lat: address.lat,
      lng: address.lng
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID || 'fb8681ab-f3e3-46c4-85b2-ea4aa0816adf';
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ ...formData, tenant_id: DEV_TENANT_ID }])
        .select()
        .single();

      if (error) throw error;

      router.push(`/contacts/${data.id}`);
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeProvider>
      <TenantLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/contacts')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Contacts
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  New Contact
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add a new customer to your database
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Address
                    </label>
                    <div className="mt-1">
                      <GoogleAddressInput
                        value={formData.address}
                        onChange={handleAddressChange}
                        placeholder="Enter customer address..."
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Initial Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Any initial notes about this customer..."
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.push('/contacts')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Creating...' : 'Create Contact'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </TenantLayout>
    </ThemeProvider>
  );
}