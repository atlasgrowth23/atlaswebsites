import { useState } from 'react';

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
}

interface PipelineLead {
  id: string;
  company_id: string;
  stage: string;
  notes: string;
  company: Company;
}

interface Props {
  lead: PipelineLead;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleBusinessModal({ lead, isOpen, onClose }: Props) {
  const [ownerName, setOwnerName] = useState('');
  const [notes, setNotes] = useState(lead.notes || '');

  console.log('SimpleBusinessModal render:', { isOpen, leadName: lead.company.name });

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Rendering modal!');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.company.name}</h2>
            <p className="text-gray-600">{lead.company.city}, {lead.company.state}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex space-x-3">
            <a
              href={`tel:${lead.company.phone}`}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📞 Call
            </a>
            <a
              href={`mailto:${lead.company.email_1}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ✉️ Email
            </a>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              💬 Text
            </button>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={lead.company.phone || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  value={lead.company.email_1 || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Level
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select level...</option>
                  <option value="1">1 - Very Low</option>
                  <option value="2">2 - Low</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Very High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Add notes about your conversation..."
            />
          </div>

          {/* Quick Checklist */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Checklist</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Owner contact verified</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Current software identified</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Budget range established</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Demo scheduled</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save Changes
            </button>
            <button 
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}