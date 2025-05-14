import React, { useState, useEffect } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';

interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  primaryColor: string;
  isMultiTech: boolean;
}

interface NotificationSettings {
  emailOnNewLead: boolean;
  emailOnNewMessage: boolean;
  smsOnNewLead: boolean;
  smsOnNewMessage: boolean;
  emailsTo: string;
  phonesTo: string;
}

interface WidgetSettings {
  buttons: {
    id: string;
    label: string;
    enabled: boolean;
    order: number;
  }[];
}

interface IntegrationSettings {
  twilioEnabled: boolean;
  twilioSid: string;
  twilioToken: string;
  twilioPhone: string;
  quickbooksEnabled: boolean;
  quickbooksToken: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
    primaryColor: '#0066FF',
    isMultiTech: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailOnNewLead: true,
    emailOnNewMessage: true,
    smsOnNewLead: false,
    smsOnNewMessage: false,
    emailsTo: '',
    phonesTo: ''
  });
  
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    buttons: [
      { id: 'repair', label: 'Repair', enabled: true, order: 0 },
      { id: 'install', label: 'Install', enabled: true, order: 1 },
      { id: 'maintain', label: 'Maintenance', enabled: true, order: 2 },
      { id: 'quote', label: 'Free Quote', enabled: true, order: 3 }
    ]
  });
  
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    twilioEnabled: false,
    twilioSid: '',
    twilioToken: '',
    twilioPhone: '',
    quickbooksEnabled: false,
    quickbooksToken: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from the API
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    if (storedBusinessSlug) {
      setBusinessSlug(storedBusinessSlug);
      
      // This would be an API call in a real app
      const mockBusinessSettings: BusinessSettings = {
        name: 'Comfort Plus Air and Heating',
        address: '123 Main St, Springfield, IL 62701',
        phone: '(555) 123-4567',
        email: 'info@comfortplusair.com',
        logo: '/logo-placeholder.png',
        primaryColor: '#0066FF',
        isMultiTech: true
      };
      
      setBusinessSettings(mockBusinessSettings);
      setLoading(false);
    }
  }, []);

  const handleSaveBusinessSettings = () => {
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      
      // Reset after a while
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      
      // Reset after a while
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 1000);
  };

  const handleSaveWidgetSettings = () => {
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('success');
      
      // Reset after a while
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 1000);
  };

  const handleMoveButtonUp = (id: string) => {
    const buttons = [...widgetSettings.buttons];
    const index = buttons.findIndex(b => b.id === id);
    
    if (index > 0) {
      const temp = buttons[index].order;
      buttons[index].order = buttons[index - 1].order;
      buttons[index - 1].order = temp;
      
      buttons.sort((a, b) => a.order - b.order);
      setWidgetSettings({ ...widgetSettings, buttons });
    }
  };

  const handleMoveButtonDown = (id: string) => {
    const buttons = [...widgetSettings.buttons];
    const index = buttons.findIndex(b => b.id === id);
    
    if (index < buttons.length - 1) {
      const temp = buttons[index].order;
      buttons[index].order = buttons[index + 1].order;
      buttons[index + 1].order = temp;
      
      buttons.sort((a, b) => a.order - b.order);
      setWidgetSettings({ ...widgetSettings, buttons });
    }
  };

  return (
    <PortalLayout title="Settings" activeTab="settings">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex">
          {/* Settings Navigation */}
          <div className="w-64 border-r">
            <nav className="py-4">
              <button
                onClick={() => setActiveTab('business')}
                className={`w-full px-4 py-2 text-left ${
                  activeTab === 'business' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Business Information
              </button>
              
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full px-4 py-2 text-left ${
                  activeTab === 'team' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Team Members
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full px-4 py-2 text-left ${
                  activeTab === 'notifications' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Notifications
              </button>
              
              <button
                onClick={() => setActiveTab('widget')}
                className={`w-full px-4 py-2 text-left ${
                  activeTab === 'widget' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Chat Widget
              </button>
              
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full px-4 py-2 text-left ${
                  activeTab === 'integrations' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Integrations
              </button>
            </nav>
          </div>
          
          {/* Settings Content */}
          <div className="flex-grow p-6 overflow-y-auto h-[calc(100vh-16rem)]">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Business Information */}
                {activeTab === 'business' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Business Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessSettings.name}
                          onChange={(e) => setBusinessSettings({...businessSettings, name: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={businessSettings.phone}
                          onChange={(e) => setBusinessSettings({...businessSettings, phone: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={businessSettings.email}
                          onChange={(e) => setBusinessSettings({...businessSettings, email: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Brand Color
                        </label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            value={businessSettings.primaryColor}
                            onChange={(e) => setBusinessSettings({...businessSettings, primaryColor: e.target.value})}
                            className="h-10 w-10 p-0 border-0"
                          />
                          <input
                            type="text"
                            value={businessSettings.primaryColor}
                            onChange={(e) => setBusinessSettings({...businessSettings, primaryColor: e.target.value})}
                            className="ml-2 w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Address
                        </label>
                        <textarea
                          value={businessSettings.address}
                          onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
                          className="w-full p-2 border rounded"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex mb-6 items-center">
                      <input
                        type="checkbox"
                        id="multi-tech"
                        checked={businessSettings.isMultiTech}
                        onChange={(e) => setBusinessSettings({...businessSettings, isMultiTech: e.target.checked})}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label htmlFor="multi-tech" className="ml-2 text-sm text-gray-700">
                        Enable multi-technician mode (schedule multiple techs on calendar)
                      </label>
                    </div>
                    
                    <div className="border-t pt-4">
                      <button 
                        onClick={handleSaveBusinessSettings}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                      </button>
                      
                      {saveStatus === 'success' && (
                        <span className="ml-3 text-green-600">
                          Settings saved successfully!
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Team Members */}
                {activeTab === 'team' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Team Members</h2>
                    
                    {!businessSettings.isMultiTech ? (
                      <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 mb-6">
                        <p className="font-medium">Multi-technician mode is disabled</p>
                        <p className="text-sm mt-1">
                          Enable multi-technician mode in Business Information settings to add team members.
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            <tr>
                              <td className="px-4 py-3 text-sm">Mike Johnson</td>
                              <td className="px-4 py-3 text-sm">Technician</td>
                              <td className="px-4 py-3 text-sm">mike@example.com</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  Active
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button className="text-blue-600 hover:underline">Edit</button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm">Sarah Williams</td>
                              <td className="px-4 py-3 text-sm">Technician</td>
                              <td className="px-4 py-3 text-sm">sarah@example.com</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  Active
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button className="text-blue-600 hover:underline">Edit</button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm">Dave Roberts</td>
                              <td className="px-4 py-3 text-sm">Technician</td>
                              <td className="px-4 py-3 text-sm">dave@example.com</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  Active
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button className="text-blue-600 hover:underline">Edit</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <div>
                      <button 
                        className={`px-4 py-2 rounded ${
                          businessSettings.isMultiTech 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!businessSettings.isMultiTech}
                      >
                        + Add Team Member
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Notification Settings</h2>
                    
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Email Notifications</h3>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="email-new-lead"
                            checked={notificationSettings.emailOnNewLead}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings, 
                              emailOnNewLead: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor="email-new-lead" className="ml-2 text-sm text-gray-700">
                            Send email when a new lead is received
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="email-new-message"
                            checked={notificationSettings.emailOnNewMessage}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings, 
                              emailOnNewMessage: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor="email-new-message" className="ml-2 text-sm text-gray-700">
                            Send email when a new message is received
                          </label>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <label className="block text-sm text-gray-700 mb-1">
                          Email Notifications To:
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.emailsTo}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emailsTo: e.target.value
                          })}
                          placeholder="email1@example.com, email2@example.com"
                          className="w-full p-2 border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate multiple email addresses with commas
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">SMS Notifications</h3>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sms-new-lead"
                            checked={notificationSettings.smsOnNewLead}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings, 
                              smsOnNewLead: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor="sms-new-lead" className="ml-2 text-sm text-gray-700">
                            Send SMS when a new lead is received
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sms-new-message"
                            checked={notificationSettings.smsOnNewMessage}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings, 
                              smsOnNewMessage: e.target.checked
                            })}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor="sms-new-message" className="ml-2 text-sm text-gray-700">
                            Send SMS when a new message is received
                          </label>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <label className="block text-sm text-gray-700 mb-1">
                          SMS Notifications To:
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.phonesTo}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            phonesTo: e.target.value
                          })}
                          placeholder="555-123-4567, 555-987-6543"
                          className="w-full p-2 border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate multiple phone numbers with commas
                        </p>
                        
                        <div className="bg-yellow-50 p-2 rounded text-sm text-yellow-800 mt-3">
                          Note: SMS notifications require Twilio integration to be enabled.
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <button 
                        onClick={handleSaveNotifications}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Notification Settings'}
                      </button>
                      
                      {saveStatus === 'success' && (
                        <span className="ml-3 text-green-600">
                          Settings saved successfully!
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Chat Widget */}
                {activeTab === 'widget' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Chat Widget Settings</h2>
                    
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Button Configuration</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Customize the buttons that appear in your website widget. Drag to reorder.
                      </p>
                      
                      <div className="border rounded-md overflow-hidden mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Button</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Enabled</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Label</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Order</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {widgetSettings.buttons.map((button, index) => (
                              <tr key={button.id}>
                                <td className="px-4 py-3 text-sm">{button.id}</td>
                                <td className="px-4 py-3 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={button.enabled}
                                    onChange={(e) => {
                                      const updatedButtons = [...widgetSettings.buttons];
                                      updatedButtons[index].enabled = e.target.checked;
                                      setWidgetSettings({ ...widgetSettings, buttons: updatedButtons });
                                    }}
                                    className="h-4 w-4 text-blue-600 rounded"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <input
                                    type="text"
                                    value={button.label}
                                    onChange={(e) => {
                                      const updatedButtons = [...widgetSettings.buttons];
                                      updatedButtons[index].label = e.target.value;
                                      setWidgetSettings({ ...widgetSettings, buttons: updatedButtons });
                                    }}
                                    className="p-1 border rounded w-full"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleMoveButtonUp(button.id)}
                                      disabled={index === 0}
                                      className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={() => handleMoveButtonDown(button.id)}
                                      disabled={index === widgetSettings.buttons.length - 1}
                                      className={`p-1 rounded ${index === widgetSettings.buttons.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                      ↓
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <button 
                        onClick={handleSaveWidgetSettings}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Widget Settings'}
                      </button>
                      
                      {saveStatus === 'success' && (
                        <span className="ml-3 text-green-600">
                          Settings saved successfully!
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Integrations */}
                {activeTab === 'integrations' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Integrations</h2>
                    
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Twilio SMS Integration</h3>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center mr-2 px-2 py-1 rounded-full text-xs ${
                            integrationSettings.twilioEnabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {integrationSettings.twilioEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <label className="relative inline-block w-10 h-5">
                            <input
                              type="checkbox"
                              checked={integrationSettings.twilioEnabled}
                              onChange={(e) => setIntegrationSettings({
                                ...integrationSettings,
                                twilioEnabled: e.target.checked
                              })}
                              className="sr-only"
                            />
                            <span className={`absolute inset-0 rounded-full transition ${
                              integrationSettings.twilioEnabled ? 'bg-blue-600' : 'bg-gray-300'
                            }`}></span>
                            <span className={`absolute inset-0 w-4 h-4 m-0.5 rounded-full transition-all transform ${
                              integrationSettings.twilioEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'
                            }`}></span>
                          </label>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Connect Twilio to send SMS notifications and enable two-way SMS communication with customers.
                      </p>
                      
                      <div className={`space-y-4 ${!integrationSettings.twilioEnabled && 'opacity-50'}`}>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Twilio Account SID
                          </label>
                          <input
                            type="text"
                            value={integrationSettings.twilioSid}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioSid: e.target.value
                            })}
                            disabled={!integrationSettings.twilioEnabled}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Twilio Auth Token
                          </label>
                          <input
                            type="password"
                            value={integrationSettings.twilioToken}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioToken: e.target.value
                            })}
                            disabled={!integrationSettings.twilioEnabled}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">
                            Twilio Phone Number
                          </label>
                          <input
                            type="text"
                            value={integrationSettings.twilioPhone}
                            onChange={(e) => setIntegrationSettings({
                              ...integrationSettings,
                              twilioPhone: e.target.value
                            })}
                            disabled={!integrationSettings.twilioEnabled}
                            placeholder="+15551234567"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">QuickBooks Integration</h3>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center mr-2 px-2 py-1 rounded-full text-xs ${
                            integrationSettings.quickbooksEnabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {integrationSettings.quickbooksEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <label className="relative inline-block w-10 h-5">
                            <input
                              type="checkbox"
                              checked={integrationSettings.quickbooksEnabled}
                              onChange={(e) => setIntegrationSettings({
                                ...integrationSettings,
                                quickbooksEnabled: e.target.checked
                              })}
                              className="sr-only"
                            />
                            <span className={`absolute inset-0 rounded-full transition ${
                              integrationSettings.quickbooksEnabled ? 'bg-blue-600' : 'bg-gray-300'
                            }`}></span>
                            <span className={`absolute inset-0 w-4 h-4 m-0.5 rounded-full transition-all transform ${
                              integrationSettings.quickbooksEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-white'
                            }`}></span>
                          </label>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Connect QuickBooks to sync invoices and customer data.
                      </p>
                      
                      <div className={`${!integrationSettings.quickbooksEnabled && 'opacity-50'}`}>
                        <button
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded"
                          disabled={!integrationSettings.quickbooksEnabled}
                        >
                          Connect to QuickBooks
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        disabled={saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Integration Settings'}
                      </button>
                      
                      {saveStatus === 'success' && (
                        <span className="ml-3 text-green-600">
                          Settings saved successfully!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}