import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { format } from 'date-fns';
import { query } from '../../../lib/db';
import SalesLayout from '../../../components/sales/Layout';
import PipelineStageSelector from '../../../components/sales/PipelineStageSelector';

// Types
interface SalesUser {
  id: number;
  name: string;
  email: string;
  territory: string;
  is_admin: boolean;
}

interface PipelineStage {
  id: number;
  name: string;
  order_num: number;
  color: string;
}

interface LeadDetailProps {
  currentUser: SalesUser;
  lead: {
    id: number;
    company_id: string;
    company_name: string;
    city: string;
    state: string;
    postal_code: string;
    phone: string;
    website: string;
    email: string;
    address: string;
    assigned_to: number;
    assigned_to_name: string;
    stage_id: number;
    stage_name: string;
    stage_color: string;
    template_shared: boolean;
    template_viewed: boolean;
    /* Removed field that was causing errors */
    /* Removed template_last_viewed field */
    last_contact_date: string | null;
    next_follow_up: string | null;
    created_at: string;
    notes: string;
  };
  salesUsers: SalesUser[];
  pipelineStages: PipelineStage[];
  activities: Array<{
    id: number;
    type: string;
    notes: string;
    created_at: string;
    created_by: number;
    created_by_name: string;
  }>;
  appointments: Array<{
    id: number;
    title: string;
    description: string;
    scheduled_date: string;
    status: string;
    created_at: string;
  }>;
}

export default function LeadDetail({ 
  currentUser, 
  lead, 
  salesUsers, 
  pipelineStages,
  activities,
  appointments
}: LeadDetailProps) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [nextFollowUp, setNextFollowUp] = useState(lead.next_follow_up || '');
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to);
  const [currentStage, setCurrentStage] = useState(lead.stage_id);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Update just the pipeline stage
  const updateStage = async (stageId: number) => {
    setIsSaving(true);
    setSaveError('');
    
    try {
      const response = await fetch('/api/sales/update-lead-stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          stageId,
          userId: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stage');
      }
      
      // Update local state to reflect the change
      window.location.reload(); // Simple refresh to show updated data
    } catch (error) {
      console.error('Error updating stage:', error);
      setSaveError('Failed to update stage. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save lead changes
  const saveLead = async () => {
    setIsSaving(true);
    setSaveError('');
    
    try {
      const response = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          next_follow_up: nextFollowUp,
          assigned_to: assignedTo,
          stage_id: currentStage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      // Add activity for the update
      await fetch('/api/sales/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          activity_type: 'update',
          user_id: currentUser.id,
          notes: 'Updated lead details',
        }),
      });

      setEditMode(false);
      alert('Lead updated successfully');
      // Reload the page to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead. Please try again.');
    }
  };

  // Add a new activity
  const addActivity = async (type: string, notes: string) => {
    try {
      const response = await fetch('/api/sales/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          activity_type: type,
          user_id: currentUser.id,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add activity');
      }

      alert('Activity added successfully');
      // Reload the page to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error adding activity:', error);
      alert('Failed to add activity. Please try again.');
    }
  };

  return (
    <SalesLayout currentUser={currentUser}>
      <Head>
        <title>{lead.company_name} | Lead Details</title>
      </Head>

      {/* Back button and header */}
      <div className="mb-8">
        <Link 
          href="/sales/leads" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Leads
        </Link>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{lead.company_name}</h1>
          <div className="flex space-x-3">
            <Link 
              href={`tel:${lead.phone}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </Link>
            <Link 
              href={`mailto:${lead.email}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Link>
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setEditMode(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveLead}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex items-center">
          <span 
            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
            style={{ backgroundColor: lead.stage_color + '20', color: lead.stage_color }}
          >
            {lead.stage_name}
          </span>
          <span className="ml-4 text-sm text-gray-500">
            Assigned to: {lead.assigned_to_name || 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Lead Information */}
          <div className="col-span-2">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lead Information</h3>
                <span className="text-sm text-gray-500">
                  Created: {formatDate(lead.created_at)}
                </span>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.company_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.website ? (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `http://${lead.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {lead.website}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.address ? (
                        <>
                          {lead.address}<br />
                          {lead.city}, {lead.state} {lead.postal_code}
                        </>
                      ) : (
                        <>
                          {lead.city}, {lead.state} {lead.postal_code}
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div>
                        {editMode ? (
                          <div>
                            <PipelineStageSelector
                              stages={pipelineStages}
                              currentStageId={currentStage}
                              onChange={setCurrentStage}
                              simplified={true}
                            />
                            <div className="mt-2 flex justify-end space-x-2">
                              <button
                                onClick={() => setEditMode(false)}
                                className="text-xs text-gray-600 hover:text-gray-800"
                                disabled={isSaving}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  updateStage(currentStage);
                                  setEditMode(false);
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                disabled={isSaving}
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                            {saveError && (
                              <p className="mt-1 text-xs text-red-600">{saveError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span 
                              className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                              style={{ backgroundColor: lead.stage_color + '20', color: lead.stage_color }}
                            >
                              {lead.stage_name}
                            </span>
                            <button
                              onClick={() => setEditMode(true)}
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {editMode ? (
                        <select 
                          value={assignedTo || ''} 
                          onChange={(e) => setAssignedTo(e.target.value ? parseInt(e.target.value) : null)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Unassigned</option>
                          {salesUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      ) : (
                        lead.assigned_to_name || 'Unassigned'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Contact</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Never'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Next Follow-up</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {editMode ? (
                        <input 
                          type="datetime-local" 
                          value={nextFollowUp} 
                          onChange={(e) => setNextFollowUp(e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      ) : (
                        lead.next_follow_up ? formatDate(lead.next_follow_up) : 'Not Scheduled'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white shadow overflow-hidden rounded-lg mt-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Notes</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {editMode ? (
                  <textarea 
                    rows={6}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add notes about this lead..."
                  />
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-900">
                    {notes ? (
                      <p>{notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">No notes added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-1">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                <button 
                  onClick={() => setActiveTab('activities')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="border-t border-gray-200">
                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((activity) => (
                      <li key={activity.id} className="px-4 py-4">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {activity.type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{activity.notes}</p>
                        <p className="mt-1 text-xs text-gray-400">By: {activity.created_by_name}</p>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 text-sm text-gray-500 italic">
                      No recent activity.
                    </li>
                  )}
                </ul>
              </div>
              <div className="border-t border-gray-200 px-4 py-4">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => addActivity('call', 'Made a call to the lead')}
                    className="flex-1 inline-flex justify-center items-center py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Log Call
                  </button>
                  <button 
                    onClick={() => addActivity('email', 'Sent an email to the lead')}
                    className="flex-1 inline-flex justify-center items-center py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Log Email
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white shadow overflow-hidden rounded-lg mt-6">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <ul className="divide-y divide-gray-200">
                  <li className="py-3">
                    <Link 
                      href={`/sales/appointments/schedule?lead=${lead.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Schedule Appointment
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link 
                      href={`/sales/templates?lead=${lead.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Share Template
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link 
                      href="/sales/reports"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Generate Report
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activity History</h3>
            <button 
              onClick={() => {
                // Modal for adding activity would go here
                const activityType = prompt('Enter activity type (call, email, meeting):');
                const activityNotes = prompt('Enter activity notes:');
                if (activityType && activityNotes) {
                  addActivity(activityType, activityNotes);
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Activity
            </button>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <li key={activity.id} className="px-4 py-4">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {activity.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{activity.notes}</p>
                    <p className="mt-1 text-xs text-gray-400">By: {activity.created_by_name}</p>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 text-sm text-gray-500 italic text-center">
                  No activity records found.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Scheduled Appointments</h3>
            <Link 
              href={`/sales/appointments/schedule?lead=${lead.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Schedule New
            </Link>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {appointment.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(appointment.scheduled_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/sales/appointments/${appointment.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                            View
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 italic text-center">
                        No appointments scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Template Management</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="mb-8">
              <h4 className="text-base font-medium text-gray-900 mb-4">Template Status</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Template Shared</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.template_shared ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Template Viewed</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {lead.template_viewed ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-600">No</span>
                      )}
                    </dd>
                  </div>
                  {/* Removed the first viewed section */}
                  {/* Template viewing details removed */}
                </dl>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-base font-medium text-gray-900 mb-4">Available Templates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {['moderntrust', 'boldenergy', 'comforttech', 'coolbreeze', 'cozyhome'].map((template) => (
                  <div key={template} className="border rounded-lg overflow-hidden">
                    <div className="h-40 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600">Template Preview Image</span>
                    </div>
                    <div className="p-4">
                      <h5 className="font-medium text-gray-900 capitalize mb-2">
                        {template.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </h5>
                      <div className="flex mt-4">
                        <Link
                          href={`/t/${template}/${lead.company_id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-800 text-sm mr-4"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => {
                            // This would actually update the lead to mark template as shared
                            alert(`Template ${template} shared with ${lead.company_name}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Share Template Link</h4>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={`https://yourdomain.com/t/moderntrust/${lead.company_id}`}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://yourdomain.com/t/moderntrust/${lead.company_id}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Share this link with the lead to let them view their custom template.
              </p>
            </div>
          </div>
        </div>
      )}
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params;
    const leadId = parseInt(id as string);
    
    if (isNaN(leadId)) {
      return { notFound: true };
    }
    
    // Get all sales users
    const usersResult = await query(
      'SELECT id, name, email, territory, is_admin FROM sales_users'
    );
    const salesUsers = usersResult.rows;
    
    // Get all pipeline stages
    const stagesResult = await query(
      'SELECT id, name, order_num, color FROM pipeline_stages ORDER BY order_num ASC'
    );
    const pipelineStages = stagesResult.rows;
    
    // Determine current user (default to admin)
    const currentUser = salesUsers.find(u => u.is_admin) || salesUsers[0];
    
    // Get lead details
    const leadResult = await query(`
      SELECT 
        l.id, 
        l.company_id, 
        c.name as company_name,
        c.city,
        c.state,
        c.postal_code,
        c.phone,
        c.site as website,
        c.email_1 as email,
        c.street as address,
        l.assigned_to,
        su.name as assigned_to_name,
        l.stage_id,
        ps.name as stage_name,
        ps.color as stage_color,
        l.template_shared,
        l.template_viewed,
        l.last_contact_date,
        l.next_follow_up,
        l.created_at,
        l.notes
      FROM 
        leads l
      JOIN 
        companies c ON l.company_id = c.id
      LEFT JOIN 
        sales_users su ON l.assigned_to = su.id
      JOIN 
        pipeline_stages ps ON l.stage_id = ps.id
      WHERE 
        l.id = $1
    `, [leadId]);
    
    if (leadResult.rows.length === 0) {
      return { notFound: true };
    }
    
    // Convert dates to ISO strings to make them serializable
    const lead = {
      ...leadResult.rows[0],
      template_last_viewed: leadResult.rows[0].template_last_viewed ? leadResult.rows[0].template_last_viewed.toISOString() : null,
      last_contact_date: leadResult.rows[0].last_contact_date ? leadResult.rows[0].last_contact_date.toISOString() : null,
      next_follow_up: leadResult.rows[0].next_follow_up ? leadResult.rows[0].next_follow_up.toISOString() : null,
      created_at: leadResult.rows[0].created_at ? leadResult.rows[0].created_at.toISOString() : null
    };
    
    // Get activities
    const activitiesResult = await query(`
      SELECT 
        a.id,
        a.type,
        a.notes,
        a.created_at,
        a.created_by,
        su.name as created_by_name
      FROM 
        lead_activities a
      LEFT JOIN
        sales_users su ON a.created_by = su.id
      WHERE 
        a.lead_id = $1
      ORDER BY 
        a.created_at DESC
    `, [leadId]);
    
    // Convert dates to ISO strings
    const activities = activitiesResult.rows.map(activity => ({
      ...activity,
      created_at: activity.created_at ? activity.created_at.toISOString() : null
    }));
    
    // Get appointments
    const appointmentsResult = await query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.scheduled_date,
        a.status,
        a.created_at
      FROM 
        appointments a
      WHERE 
        a.lead_id = $1
      ORDER BY 
        a.scheduled_date DESC
    `, [leadId]);
    
    // Convert dates to ISO strings
    const appointments = appointmentsResult.rows.map(appt => ({
      ...appt,
      scheduled_date: appt.scheduled_date ? appt.scheduled_date.toISOString() : null,
      created_at: appt.created_at ? appt.created_at.toISOString() : null
    }));
    
    return {
      props: {
        lead,
        salesUsers,
        pipelineStages,
        currentUser,
        activities,
        appointments
      },
    };
  } catch (error) {
    console.error('Error fetching lead data:', error);
    return { notFound: true };
  }
};