import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LineItemsEditor from '@/components/invoice/LineItemsEditor';
import { Estimate, EstimateStatusLabels } from '@/types/invoice';

interface EstimateDetailProps {
  estimate: Estimate;
  businessId: string;
  onApprove?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onSendEstimate?: () => Promise<void>;
  onGeneratePdf?: () => Promise<void>;
  onConvertToInvoice?: () => Promise<void>;
  onCancelEstimate?: () => Promise<void>;
  isSaving?: boolean;
}

export default function EstimateDetail({
  estimate,
  businessId,
  onApprove,
  onReject,
  onSendEstimate,
  onGeneratePdf,
  onConvertToInvoice,
  onCancelEstimate,
  isSaving = false
}: EstimateDetailProps) {
  const router = useRouter();
  
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
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Check if estimate is expired
  const isExpired = estimate.date_expires 
    ? new Date(estimate.date_expires) < new Date() 
    : false;
  
  // Check if estimate can be converted to invoice
  const canConvertToInvoice = ['approved', 'viewed', 'sent'].includes(estimate.status) && !isExpired;
  
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
                    Estimate #{estimate.estimate_number}
                  </h2>
                  <div className="mt-1 flex items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(estimate.status)}`}>
                      {EstimateStatusLabels[estimate.status as keyof typeof EstimateStatusLabels] || estimate.status}
                    </span>
                    {isExpired && estimate.status !== 'expired' && (
                      <span className="ml-2 text-sm text-orange-600">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-gray-600 text-sm">
                  <div>Created: {formatDate(estimate.created_at)}</div>
                  {estimate.updated_at && <div>Last Updated: {formatDate(estimate.updated_at)}</div>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Issued</h3>
                  <p className="mt-1 text-lg">{formatDate(estimate.date_issued)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valid Until</h3>
                  <p className="mt-1 text-lg">{formatDate(estimate.date_expires)}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Line Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <LineItemsEditor
                    items={estimate.items || []}
                    onChange={() => {}} // Read-only
                    readOnly={true}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {estimate.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
                    </div>
                  </div>
                )}
                
                {estimate.terms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Terms & Conditions</h3>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{estimate.terms}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Approval Actions */}
          {['sent', 'viewed'].includes(estimate.status) && !isExpired && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Customer Approval</h3>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        When the customer approves this estimate, you can convert it to an invoice.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  {onApprove && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={onApprove}
                      disabled={isSaving}
                    >
                      Mark as Approved
                    </Button>
                  )}
                  
                  {onReject && (
                    <Button 
                      className="flex-1"
                      variant="outline"
                      onClick={onReject}
                      disabled={isSaving}
                    >
                      Mark as Rejected
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Customer Information</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                  <p className="text-lg font-medium">{estimate.contact?.name}</p>
                </div>
                
                {estimate.contact?.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p>{estimate.contact.email}</p>
                  </div>
                )}
                
                {estimate.contact?.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <p>{estimate.contact.phone}</p>
                  </div>
                )}
                
                {estimate.contact?.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    <p>{estimate.contact.address}</p>
                    <p>
                      {estimate.contact.city}, {estimate.contact.state} {estimate.contact.zip}
                    </p>
                  </div>
                )}
                
                <Button 
                  className="mt-2" 
                  variant="outline"
                  onClick={() => router.push(`/hvacportal/contacts/${estimate.contact_id}`)}
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
                
                {/* Send Estimate */}
                {onSendEstimate && estimate.status !== 'cancelled' && !['approved', 'rejected', 'converted', 'expired'].includes(estimate.status) && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={onSendEstimate}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Send to Customer
                  </Button>
                )}
                
                {/* Convert to Invoice */}
                {onConvertToInvoice && canConvertToInvoice && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={onConvertToInvoice}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Convert to Invoice
                  </Button>
                )}
                
                {/* Cancel Estimate */}
                {onCancelEstimate && !['cancelled', 'converted', 'rejected'].includes(estimate.status) && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={onCancelEstimate}
                    disabled={isSaving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Cancel Estimate
                  </Button>
                )}
                
                {/* Edit Estimate */}
                {estimate.status === 'draft' && (
                  <Button 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    onClick={() => router.push(`/hvacportal/estimates/${estimate.id}/edit`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                    Edit Estimate
                  </Button>
                )}
                
                {/* Back to List */}
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push('/hvacportal/estimates')}
                >
                  Back to Estimates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}