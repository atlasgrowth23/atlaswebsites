import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Lead {
  id: number;
  company_id: string;
  company_name: string;
  city: string;
  state: string;
  phone: string;
  assigned_to: number;
  assigned_to_name: string;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  template_shared: boolean;
  template_viewed: boolean;
  last_contact_date: string | null;
  next_follow_up: string | null;
}

interface LeadsTableProps {
  leads: Lead[];
  onTrackCall: (leadId: number) => void;
}

const formatDate = (dateString: string) => {
  try {
    // Use ISO date format for consistent server/client rendering
    return dateString.split('T')[0];
  } catch (e) {
    return dateString;
  }
};

export default function LeadsTable({ leads, onTrackCall }: LeadsTableProps) {
  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Follow-up
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/sales/leads/${lead.id}`} className="text-blue-600 hover:underline font-medium">
                        {lead.company_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.city || 'N/A'}, {lead.state || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        style={{ backgroundColor: lead.stage_color + '20', color: lead.stage_color }}
                      >
                        {lead.stage_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {lead.next_follow_up ? (
                        <span className="text-gray-500">
                          {formatDate(lead.next_follow_up)}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not Scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.assigned_to_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-4 justify-end">
                        <Link 
                          href={`tel:${lead.phone}`} 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => onTrackCall(lead.id)}
                        >
                          Call
                        </Link>
                        <Link href={`/sales/leads/${lead.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No leads found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}