import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface Invoice {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  created: number;
  due_date?: number;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customer_name: '',
    customer_email: '',
    amount: '',
    description: '',
    due_days: '30'
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/list');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvoice),
      });

      if (response.ok) {
        const result = await response.json();
        setInvoices([result.invoice, ...invoices]);
        setShowCreateModal(false);
        setNewInvoice({
          customer_name: '',
          customer_email: '',
          amount: '',
          description: '',
          due_days: '30'
        });
      } else {
        alert('Error creating invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'void': return 'bg-gray-100 text-gray-800';
      case 'uncollectible': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading && invoices.length === 0) {
    return (
      <AdminLayout currentPage="pipeline">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading invoices...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="invoices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage customer invoices and payments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customer_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {invoice.hosted_invoice_url && (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </a>
                        )}
                        {invoice.invoice_pdf && (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                          >
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Create New Invoice</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newInvoice.customer_name}
                    onChange={(e) => setNewInvoice({...newInvoice, customer_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={newInvoice.customer_email}
                    onChange={(e) => setNewInvoice({...newInvoice, customer_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Website development services..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due in (days)
                  </label>
                  <select
                    value={newInvoice.due_days}
                    onChange={(e) => setNewInvoice({...newInvoice, due_days: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createInvoice}
                  disabled={!newInvoice.customer_name || !newInvoice.customer_email || !newInvoice.amount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}