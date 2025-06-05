import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

interface Customization {
  customization_type: string;
  custom_value: string;
  original_value?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
}

export default function TemplateEditor() {
  const router = useRouter();
  const { slug } = router.query;
  const [selectedTemplate, setSelectedTemplate] = useState('moderntrust');
  const [company, setCompany] = useState<Company | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [customDomain, setCustomDomain] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDomainSaving, setIsDomainSaving] = useState(false);
  const [message, setMessage] = useState('');
  // Available customization options (using actual frame keys from templates)
  const customizationOptions = {
    images: [
      { key: 'hero_img', label: 'Hero Background 1', description: 'First hero slide background image' },
      { key: 'hero_img_2', label: 'Hero Background 2', description: 'Second hero slide background image' },
      { key: 'about_img', label: 'About Section Image', description: 'Image displayed in the about us section' }
    ]
  };

  useEffect(() => {
    if (slug) {
      fetchCompanyData();
      fetchCustomizations();
    }
  }, [slug, selectedTemplate]);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch(`/api/template-customizations?slug=${slug}&getCompany=true`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        // Load existing custom domain if available
        setCustomDomain(data.custom_domain || '');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchCustomizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/template-customizations?slug=${slug}&template=${selectedTemplate}`);
      if (response.ok) {
        const data = await response.json();
        const customizationMap: Record<string, string> = {};
        data.forEach((custom: Customization) => {
          customizationMap[custom.customization_type] = custom.custom_value;
        });
        setCustomizations(customizationMap);
      }
    } catch (error) {
      console.error('Error fetching customizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!company) return;
    
    setIsSaving(true);
    setMessage('Downloading and saving images to storage...');

    try {
      // Process each image URL - download and save to storage
      const processedCustomizations: Record<string, string> = {};
      
      for (const [frameKey, imageUrl] of Object.entries(customizations)) {
        if (imageUrl && imageUrl.trim() !== '') {
          setMessage(`Processing ${frameKey}...`);
          
          const uploadResponse = await fetch('/api/upload-image-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: imageUrl.trim(),
              companyId: company.id,
              frameType: frameKey
            })
          });

          const uploadData = await uploadResponse.json();

          if (uploadResponse.ok) {
            processedCustomizations[frameKey] = uploadData.storageUrl;
          } else {
            console.error(`Failed to process ${frameKey}:`, uploadData.error);
            // Keep original URL as fallback
            processedCustomizations[frameKey] = imageUrl.trim();
          }
        }
      }

      // Update customizations state with storage URLs
      setCustomizations(processedCustomizations);
      
      setMessage('✅ Images saved to storage! Website will update automatically.');
      setTimeout(() => setMessage(''), 5000);
      
      // Show preview link
      if (company?.slug) {
        setTimeout(() => {
          setMessage(prev => prev + ` 🔗 View changes: /t/moderntrust/${company.slug}`);
        }, 1000);
      }
    } catch (error) {
      setMessage('❌ Error saving images. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveDomain = async () => {
    if (!company?.id || !customDomain.trim()) return;
    
    setIsDomainSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/manage-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          customDomain: customDomain.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.vercelError 
          ? '⚠️ Domain saved! Please manually add to Vercel dashboard.' 
          : '✅ Custom domain configured successfully!');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('❌ Failed to configure domain. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Error configuring domain. Please try again.');
    } finally {
      setIsDomainSaving(false);
    }
  };

  const previewTemplate = () => {
    if (company) {
      window.open(`/t/${selectedTemplate}/${company.slug}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text>Loading template editor...</Text>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`Template Editor - ${company?.name} | Atlas Growth`}</title>
        <meta name="description" content="Customize template appearance for individual business" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <Container>
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Heading level={2} className="text-gray-900">
                    Template Editor - {company?.name}
                  </Heading>
                  <Text size="sm" className="text-gray-600 mt-1">
                    Customize images and content for this business
                  </Text>
                </div>
                <div className="flex gap-3">
                  <Link href={`/company/${slug}`}>
                    <Button variant="outline">← Back to Company</Button>
                  </Link>
                  <Button onClick={previewTemplate} variant="outline">
                    Preview Template
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Template Selection Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <Heading level={4} className="mb-4">Select Template</Heading>
                  <div className="space-y-3">
                    {[
                      { key: 'moderntrust', name: 'ModernTrust', color: 'Blue Theme' },
                      { key: 'boldenergy', name: 'BoldEnergy', color: 'Orange Theme' },
                      { key: 'naturalearthpro', name: 'NaturalEarthPro', color: 'Green Theme' }
                    ].map(template => (
                      <button
                        key={template.key}
                        onClick={() => setSelectedTemplate(template.key)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === template.key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.color}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization Form */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {/* Custom Domain Section */}
                <Card>
                  <CardContent className="p-6">
                    <Heading level={4} className="mb-6">🌐 Custom Domain</Heading>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-2">
                          Custom Domain (e.g., yourcompany.com)
                        </label>
                        <Text size="sm" className="text-gray-500 mb-2">
                          Enter a custom domain to make this business accessible on their own website
                        </Text>
                        <div className="flex gap-3">
                          <Input
                            type="text"
                            placeholder="example.com"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={saveDomain}
                            disabled={isDomainSaving || !customDomain.trim()}
                            className="whitespace-nowrap"
                          >
                            {isDomainSaving ? 'Configuring...' : 'Save Domain'}
                          </Button>
                        </div>
                        {customDomain && (
                          <Text size="sm" className="text-blue-600 mt-2">
                            Preview: https://{customDomain}
                          </Text>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                  <CardContent className="p-6">
                    <Heading level={4} className="mb-6">🖼️ Custom Images</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customizationOptions.images.map(option => (
                        <div key={option.key} className="space-y-2">
                          <label className="block font-medium text-gray-700">
                            {option.label}
                          </label>
                          <Text size="sm" className="text-gray-500">
                            {option.description}
                          </Text>
                          <Input
                            type="url"
                            placeholder="Enter image URL..."
                            value={customizations[option.key] || ''}
                            onChange={(e) => handleInputChange(option.key, e.target.value)}
                            className="w-full"
                          />
                          {customizations[option.key] && (
                            <div className="mt-2">
                              <img
                                src={customizations[option.key]}
                                alt={option.label}
                                className="w-full h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardContent className="p-6">
                    <Heading level={4} className="mb-4">💡 How It Works</Heading>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Add custom images by pasting image URLs above</p>
                      <p>• These images will override the default template images for this business only</p>
                      <p>• Leave fields empty to use the default template images</p>
                      <p>• Changes apply immediately after saving</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div>
                    {message && (
                      <Text size="sm" className={message.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                        {message}
                      </Text>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setCustomizations({})}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Reset All
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-8"
                    >
                      {isSaving ? 'Saving...' : 'Save Customizations'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}