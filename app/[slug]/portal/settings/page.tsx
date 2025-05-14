'use client';

import { useState, useEffect } from 'react';

interface CompanySettings {
  id: string;
  name: string;
  brand_color: string;
  accent_color: string;
  multi_tech: boolean;
  settings: {
    schedule_origin?: string;
    buttons?: string[];
    notifications?: {
      email_on_lead?: boolean;
    };
  };
}

export default function SettingsPage({ params }: { params: { slug: string } }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    brand_color: '#0077b6',
    accent_color: '#00b4d8',
    multi_tech: false,
    buttons: ['AC Repair', 'Heating Service', 'Maintenance', 'Quote'],
    email_on_lead: true,
  });
  const [activeTab, setActiveTab] = useState('profile');
  
  // Function to load company settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/company/settings?slug=${params.slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to load company settings');
      }
      
      const data = await response.json();
      setSettings(data);
      
      // Update form data with loaded settings
      setFormData({
        brand_color: data.brand_color || '#0077b6',
        accent_color: data.accent_color || '#00b4d8',
        multi_tech: data.multi_tech || false,
        buttons: data.settings?.buttons || ['AC Repair', 'Heating Service', 'Maintenance', 'Quote'],
        email_on_lead: data.settings?.notifications?.email_on_lead !== false,
      });
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [params.slug]);
  
  // Function to save company settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        brand_color: formData.brand_color,
        accent_color: formData.accent_color,
        multi_tech: formData.multi_tech,
        settings: {
          buttons: formData.buttons,
          notifications: {
            email_on_lead: formData.email_on_lead,
          },
        },
      };
      
      const response = await fetch('/api/company/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySlug: params.slug,
          ...updatedSettings,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Update local settings
      setSettings((prev) => prev ? { ...prev, ...updatedSettings } : null);
      
      // Show success indicator (could add toast here)
      alert('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setSaving(false);
    }
  };
  
  // Function to update a button in the list
  const handleUpdateButton = (index: number, value: string) => {
    const updatedButtons = [...formData.buttons];
    updatedButtons[index] = value;
    setFormData({ ...formData, buttons: updatedButtons });
  };
  
  // Function to add a new button
  const handleAddButton = () => {
    if (formData.buttons.length < 6) {
      setFormData({
        ...formData,
        buttons: [...formData.buttons, 'New Button'],
      });
    }
  };
  
  // Function to remove a button
  const handleRemoveButton = (index: number) => {
    const updatedButtons = formData.buttons.filter((_, i) => i !== index);
    setFormData({ ...formData, buttons: updatedButtons });
  };
  
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
            onClick={loadSettings}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-1 ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Business Profile
          </button>
          
          <button
            onClick={() => setActiveTab('widget')}
            className={`pb-4 px-1 ${
              activeTab === 'widget'
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Widget Buttons
          </button>
          
          {formData.multi_tech && (
            <button
              onClick={() => setActiveTab('team')}
              className={`pb-4 px-1 ${
                activeTab === 'team'
                  ? 'border-b-2 border-primary font-medium text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Team Members
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-4 px-1 ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary font-medium text-primary'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Notifications
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Business Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Business Profile
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label 
                    htmlFor="brand_color" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Brand Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      id="brand_color"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Primary brand color for buttons and accents
                  </p>
                </div>
                
                <div>
                  <label 
                    htmlFor="accent_color" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      id="accent_color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Secondary accent color for highlights
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label 
                    htmlFor="logo"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Business Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 flex flex-col items-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Logo upload coming soon
                    </p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="multi_tech"
                      checked={formData.multi_tech}
                      onChange={(e) => setFormData({ ...formData, multi_tech: e.target.checked })}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label
                      htmlFor="multi_tech"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      Enable multi-technician mode
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Turn on if you have multiple field technicians
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Widget Buttons Tab */}
          {activeTab === 'widget' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Widget Buttons
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure the buttons that appear in your chat widget. These buttons help customers select the type of service they need.
              </p>
              
              <div className="space-y-4">
                {formData.buttons.map((button, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={button}
                      onChange={(e) => handleUpdateButton(index, e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm flex-1"
                      placeholder="Button text"
                    />
                    <button
                      onClick={() => handleRemoveButton(index)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
                
                {formData.buttons.length < 6 && (
                  <button
                    onClick={handleAddButton}
                    className="flex items-center px-4 py-2 text-sm text-primary hover:text-primary/80"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Button
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Team Members Tab */}
          {activeTab === 'team' && formData.multi_tech && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Team Members
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your technicians and dispatchers.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-md text-center">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  Team member management coming soon
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You'll be able to invite, manage, and assign jobs to your team members.
                </p>
              </div>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Notification Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure when and how you want to be notified about new activities.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email_on_lead"
                    checked={formData.email_on_lead}
                    onChange={(e) => setFormData({ ...formData, email_on_lead: e.target.checked })}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="email_on_lead"
                    className="ml-2 block text-sm text-gray-900 dark:text-white"
                  >
                    Email me when a new lead comes in
                  </label>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-md">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                    More notification options coming soon
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SMS notifications and more customization options are on the way.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}