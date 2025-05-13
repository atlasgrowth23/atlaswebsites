import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvoiceItem, EstimateItem, ItemType, ItemTypeLabels, CommonServiceDescriptions, CommonPartDescriptions } from '@/types/invoice';

interface LineItemsEditorProps {
  items: (InvoiceItem | EstimateItem)[];
  onChange: (items: (InvoiceItem | EstimateItem)[]) => void;
  taxRate?: number;
  readOnly?: boolean;
}

export default function LineItemsEditor({ 
  items, 
  onChange, 
  taxRate = 0,
  readOnly = false
}: LineItemsEditorProps) {
  // Format currency input value
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return '';
    
    // Format with two decimal places, no currency symbol
    return value.toFixed(2);
  };

  // Parse currency input value
  const parseCurrency = (value: string): number => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Add a new empty line item
  const addItem = () => {
    const newItem = {
      id: Date.now(), // Temporary id for frontend use
      item_type: 'service' as ItemType,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      tax_rate: taxRate
    } as InvoiceItem | EstimateItem;
    
    onChange([...items, newItem]);
  };

  // Remove a line item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  // Update a line item property
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // Recalculate amount if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      item.amount = Number(item.quantity) * Number(item.unit_price);
      
      // Also update tax amount if tax_rate is specified
      if (item.tax_rate && item.tax_rate > 0) {
        item.tax_amount = item.amount * (item.tax_rate / 100);
      }
    }
    
    // Update tax amount if tax_rate changed
    if (field === 'tax_rate') {
      item.tax_amount = item.amount * (value / 100);
    }
    
    newItems[index] = item;
    onChange(newItems);
  };

  // Suggest common descriptions based on item type
  const getSuggestions = (itemType: ItemType): string[] => {
    switch (itemType) {
      case 'service':
        return CommonServiceDescriptions;
      case 'part':
      case 'material':
        return CommonPartDescriptions;
      default:
        return [];
    }
  };

  // If no items exist yet, add a default one
  useEffect(() => {
    if (items.length === 0 && !readOnly) {
      addItem();
    }
  }, [items, readOnly]);

  // Calculate subtotal, tax, and total
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = items.reduce((sum, item) => {
    const taxAmount = item.tax_amount || (item.amount * (item.tax_rate || 0) / 100);
    return sum + taxAmount;
  }, 0);
  const total = subtotal + taxTotal;

  return (
    <div className="space-y-4">
      {/* Line items header */}
      <div className="grid grid-cols-12 gap-2 text-sm text-gray-500 font-medium border-b pb-2">
        <div className="col-span-1">#</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-1">Qty</div>
        <div className="col-span-1">Price</div>
        <div className="col-span-1">Tax</div>
        <div className="col-span-1">Amount</div>
        {!readOnly && <div className="col-span-1"></div>}
      </div>

      {/* Line items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1 text-gray-500">{index + 1}</div>
            
            <div className="col-span-2">
              {readOnly ? (
                <div className="text-sm">
                  {ItemTypeLabels[item.item_type as ItemType] || item.item_type}
                </div>
              ) : (
                <select
                  value={item.item_type}
                  onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  {Object.entries(ItemTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="col-span-4">
              {readOnly ? (
                <div className="text-sm">{item.description}</div>
              ) : (
                <div className="relative">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    list={`suggestions-${index}`}
                    className="w-full"
                  />
                  <datalist id={`suggestions-${index}`}>
                    {getSuggestions(item.item_type as ItemType).map((suggestion, i) => (
                      <option key={i} value={suggestion} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>
            
            <div className="col-span-1">
              {readOnly ? (
                <div className="text-sm">{item.quantity}</div>
              ) : (
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              )}
            </div>
            
            <div className="col-span-1">
              {readOnly ? (
                <div className="text-sm">${formatCurrency(item.unit_price)}</div>
              ) : (
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">$</span>
                  <Input
                    type="text"
                    value={formatCurrency(item.unit_price)}
                    onChange={(e) => updateItem(index, 'unit_price', parseCurrency(e.target.value))}
                    className="pl-6 w-full"
                  />
                </div>
              )}
            </div>
            
            <div className="col-span-1">
              {readOnly ? (
                <div className="text-sm">{item.tax_rate || 0}%</div>
              ) : (
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.tax_rate || taxRate}
                    onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                    className="pr-6 w-full"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">%</span>
                </div>
              )}
            </div>
            
            <div className="col-span-1 font-medium">
              ${formatCurrency(item.amount)}
            </div>
            
            {!readOnly && (
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add line item button */}
      {!readOnly && (
        <div className="pt-2">
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            + Add Line Item
          </Button>
        </div>
      )}

      {/* Totals */}
      <div className="border-t pt-4 mt-6">
        <div className="flex flex-col space-y-2 ml-auto w-64">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span>${formatCurrency(taxTotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Total:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}