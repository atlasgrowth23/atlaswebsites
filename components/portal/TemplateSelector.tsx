import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// Available templates - add more as created
const TEMPLATES = [
  {
    key: 'moderntrust',
    name: 'Modern Trust',
    description: 'A professional, clean design with strong trust signals and clear calls to action.',
    thumbnail: '/templates/moderntrust/thumbnail.jpg',
  },
  {
    key: 'boldenergy',
    name: 'Bold Energy',
    description: 'A vibrant, high-energy design with bold colors for companies with a modern brand.',
    thumbnail: '/templates/boldenergy/thumbnail.jpg',
  },
  {
    key: 'premiumservice',
    name: 'Premium Service',
    description: 'A comprehensive template with strong call-to-actions and detailed service sections.',
    thumbnail: '/templates/premiumservice/thumbnail.jpg',
  },
  {
    key: 'classicomfort',
    name: 'Classic Comfort',
    description: 'A timeless, warm design emphasizing comfort and reliability for established businesses.',
    thumbnail: '/templates/classicomfort/thumbnail.jpg',
  }
];

interface TemplateSelectorProps {
  currentTemplate: string;
  businessSlug: string;
  onTemplateChange: (templateKey: string) => void;
}

export default function TemplateSelector({ 
  currentTemplate = 'moderntrust',
  businessSlug,
  onTemplateChange
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const handleSelectTemplate = async (templateKey: string) => {
    setSelectedTemplate(templateKey);
  };
  
  const handleApplyTemplate = async () => {
    if (selectedTemplate === currentTemplate) return;
    
    try {
      // Call API to update the template for this business
      const response = await fetch('/api/update-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessSlug,
          templateKey: selectedTemplate
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Call the parent callback to update the UI
        onTemplateChange(selectedTemplate);
      } else {
        alert('Failed to update template: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('An error occurred while updating the template');
    }
  };
  
  const openPreview = () => {
    setIsPreviewOpen(true);
    // Open preview in new tab
    window.open(`/t/${selectedTemplate}/${businessSlug}?preview=true`, '_blank');
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Website Template</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Choose the template design for your business website.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map(template => (
            <div 
              key={template.key}
              className={`border rounded-lg p-3 cursor-pointer transition ${
                selectedTemplate === template.key 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectTemplate(template.key)}
            >
              <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Preview
                  </div>
                )}
              </div>
              <h3 className="font-medium text-sm">{template.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button 
          variant="outline" 
          onClick={openPreview}
        >
          Preview
        </Button>
        <Button
          onClick={handleApplyTemplate}
          disabled={selectedTemplate === currentTemplate}
        >
          Apply Template
        </Button>
      </div>
    </div>
  );
}