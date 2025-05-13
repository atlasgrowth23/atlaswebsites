import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LineItemsEditor from '@/components/invoice/LineItemsEditor';
import { Invoice, InvoiceStatusLabels, PaymentTransaction, PaymentMethod, PaymentMethodLabels } from '@/types/invoice';

interface InvoiceDetailProps {
  invoice: Invoice;
  payments?: PaymentTransaction[];
  businessId: string;
  onMarkAsPaid?: () => Promise<void>;
  onSendInvoice?: () => Promise<void>;
  onGeneratePdf?: () => Promise<void>;
  onAddPayment?: (payment: Partial<PaymentTransaction>) => Promise<void>;
  onVoidInvoice?: () => Promise<void>;
  isSaving?: boolean;
}

export default function InvoiceDetail({
  invoice,
  payments = [],
  businessId,
  onMarkAsPaid,
  onSendInvoice,
  onGeneratePdf,
  onAddPayment,
  onVoidInvoice,
  isSaving = false
}: InvoiceDetailProps) {
  const router = useRouter();
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<Partial<PaymentTransaction>>({
    company_id: businessId,
    invoice_id: invoice.id,
    contact_id: invoice.contact_id,
    transaction_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash'
  });

  // Calculate payment status
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balanceDue = invoice.total_amount - totalPaid;
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-purple-100 text-purple-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'void':
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle payment form input changes
  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddPayment) {
      await onAddPayment(paymentData);
      setIsAddingPayment(false);
      setPaymentData({
        company_id: businessId,
        invoice_id: invoice.id,
        contact_id: invoice.contact_id,
        transaction_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: 'cash'
      });
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Left column */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Invoice #{invoice.invoice_number}
                  </h2>
                  <div className="mt-1 flex items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(invoice.status)}`}>
                      {InvoiceStatusLabels[invoice.status as keyof typeof InvoiceStatusLabels] || invoice.status}
                    </span>
                    {invoice.status === 'overdue' && (
                      <span className="ml-2 text-sm text-red-600">
                        Overdue by {Math.floor((Date.now() - new Date(invoice.due_date!).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-gray-600 text-sm">
                  <div>Created: {formatDate(invoice.created_at)}</div>
                  {invoice.updated_at && <div>Last Updated: {formatDate(invoice.updated_at)}</div>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Issued</h3>
                  <p className="mt-1 text-lg">{formatDate(invoice.date_issued)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="mt-1 text-lg">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <LineItemsEditor
                    items={invoice.items || []}
                    onChange={() => {}} // Read-only
                    readOnly={true}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  </div>
                )}
                
                {invoice.terms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Terms & Conditions</h3>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  </div>
                )}
                
                {invoice.payment_instructions && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Instructions</h3>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{invoice.payment_instructions}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Payment History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Payment History</h3>
                {!['void', 'paid', 'cancelled'].includes(invoice.status) && onAddPayment && (
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingPayment(!isAddingPayment)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {isAddingPayment ? 'Cancel' : '+ Record Payment'}
                  </Button>
                )}
              </div>
              
              {isAddingPayment && (
                <form onSubmit={handlePaymentSubmit} className="mb-6 border rounded-md p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input
                        type="date"
                        name="transaction_date"
                        value={paymentData.transaction_date?.toString().split('T')[0] || ''}
                        onChange={handlePaymentChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        name="payment_method"
                        value={paymentData.payment_method || 'cash'}
                        onChange={handlePaymentChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {Object.entries(PaymentMethodLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                        <input
                          type="number"
                          name="amount"
                          step="0.01"
                          min="0.01"
                          max={balanceDue}
                          value={paymentData.amount || ''}
                          onChange={handlePaymentChange}
                          required
                          className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
                      <input
                        type="text"
                        name="payment_reference"
                        value={paymentData.payment_reference || ''}
                        onChange={handlePaymentChange}
                        placeholder="Check #, Transaction ID, etc."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        name="notes"
                        value={paymentData.notes || ''}
                        onChange={handlePaymentChange}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingPayment(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Record Payment'}
                    </Button>
                  </div>
                </form>
              )}
              
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.transaction_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {PaymentMethodLabels[payment.payment_method as PaymentMethod] || payment.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_reference || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {payment.notes || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 italic">
                  No payments recorded yet.
                </div>
              )}
              
              {/* Payment Summary */}
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Invoice Total:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Amount Paid:</span>
                  <span>{formatCurrency(totalPaid)}</span>
                </div>
                
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t">
                  <span>Balance Due:</span>
                  <span className={balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Customer Information</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                  <p className="text-lg font-medium">{invoice.contact?.name}</p>
                </div>
                
                {invoice.contact?.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p>{invoice.contact.email}</p>
                  </div>
                )}
                
                {invoice.contact?.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <p>{invoice.contact.phone}</p>
                  </div>
                )}
                
                {invoice.contact?.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p>{invoice.contact.address}</p>
                    <p>
                      {invoice.contact.city}, {invoice.contact.state} {invoice.contact.zip}
                    </p>
                  </div>
                )}
                
                <Button 
                  className="mt-2" 
                  variant="outline"
                  onClick={() => router.push(`/hvacportal/contacts/${invoice.contact_id}`)}
                >
                  View Contact
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Actions</h3>
              
              <div className="space-y-3">
                {/* PDF Generation */}
                {onGeneratePdf && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={onGeneratePdf}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Download PDF
                  </Button>
                )}
                
                {/* Send Invoice */}
                {onSendInvoice && invoice.status !== 'void' && invoice.status !== 'cancelled' && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={onSendInvoice}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Send to Customer
                  </Button>
                )}
                
                {/* Mark as Paid */}
                {onMarkAsPaid && invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled' && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={onMarkAsPaid}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Mark as Paid
                  </Button>
                )}
                
                {/* Void Invoice */}
                {onVoidInvoice && !['void', 'cancelled'].includes(invoice.status) && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={onVoidInvoice}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Void Invoice
                  </Button>
                )}
                
                {/* Edit Invoice */}
                {invoice.status === 'draft' && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={() => router.push(`/hvacportal/invoices/${invoice.id}/edit`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    Edit Invoice
                  </Button>
                )}
                
                {/* Back to List */}
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push('/hvacportal/invoices')}
                >
                  Back to Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}