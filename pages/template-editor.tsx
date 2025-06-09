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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  // Available customization options (using actual frame keys from templates)
  const customizationOptions = {
    images: [
      { key: 'hero_img', label: 'Hero Background Image', description: 'Main hero section background image' },
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
    setMessage('Saving customizations...');

    try {
      const requestData = {
        companyId: company.id,
        templateKey: selectedTemplate,
        customizations: customizations
      };
      
      console.log('🚀 Sending save request:', requestData);
      
      // Save customizations using the template-customizations API
      const response = await fetch('/api/template-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('📡 API Response:', { status: response.status, data });

      if (response.ok) {
        console.log('✅ Save response:', data);
        
        if (data.updatedFrames && data.updatedFrames.length > 0) {
          setMessage(`✅ Saved ${data.updatedFrames.length} images: ${data.updatedFrames.join(', ')}`);
        } else {
          setMessage('✅ Customizations saved successfully!');
        }
        
        // Show any errors
        if (data.errors && data.errors.length > 0) {
          console.error('Save errors:', data.errors);
          setTimeout(() => {
            setMessage(prev => prev + ` ⚠️ Errors: ${data.errors.join(', ')}`);
          }, 1000);
        }
        
        // Refresh customizations to get the latest storage URLs
        setTimeout(() => {
          fetchCustomizations();
        }, 2000);
        
        // Show preview link
        setTimeout(() => {
          setMessage(prev => prev + ` 🔗 View: /t/${selectedTemplate}/${company.slug}`);
        }, 3000);
      } else {
        console.error('Save failed:', data);
        if (data.partial) {
          setMessage(`⚠️ Partially saved: ${data.updatedFrames?.length || 0} successful, ${data.errors?.length || 0} errors`);
        } else {
          setMessage('❌ Error saving customizations. Please try again.');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage('❌ Error saving customizations. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 8000);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !company?.id) return;
    
    setIsLogoUploading(true);
    setMessage('Uploading logo...');

    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      formData.append('companyId', company.id);
      formData.append('frameType', 'logo');

      const response = await fetch('/api/upload-logo-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Logo uploaded successfully!');
        setLogoFile(null);
        
        // Update the customizations with the new logo URL
        setCustomizations(prev => ({
          ...prev,
          logo: data.storageUrl
        }));
        
        // Refresh customizations to get the latest data
        setTimeout(() => {
          fetchCustomizations();
        }, 1000);
        
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage(`❌ Upload failed: ${data.error}`);
        setTimeout(() => setMessage(''), 6000);
      }
    } catch (error) {
      setMessage('❌ Error uploading logo. Please try again.');
      setTimeout(() => setMessage(''), 6000);
    } finally {
      setIsLogoUploading(false);
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
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full overflow-hidden">
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
            <div className="lg:col-span-3 min-w-0">
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

                {/* Logo Upload Section */}
                <Card>
                  <CardContent className="p-6">
                    <Heading level={4} className="mb-6">🏢 Company Logo</Heading>
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium text-gray-700 mb-2">
                          Upload Logo File
                        </label>
                        <Text size="sm" className="text-gray-500 mb-4">
                          Upload your company logo (JPG, PNG, WebP, or SVG). Maximum file size: 5MB.
                        </Text>
                        
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-3 focus:ring-blue-500 focus:border-blue-500 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          <Button
                            onClick={uploadLogo}
                            disabled={!logoFile || isLogoUploading}
                            className="px-6 bg-green-600 text-white hover:bg-green-700"
                          >
                            {isLogoUploading ? 'Uploading...' : 'Upload Logo'}
                          </Button>
                        </div>
                        
                        {logoFile && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {logoFile.name} ({(logoFile.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                      </div>
                      
                      {/* Current Logo Preview */}
                      {customizations.logo && (
                        <div className="mt-4">
                          <label className="block font-medium text-gray-700 mb-2">Current Logo</label>
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <img
                              src={customizations.logo}
                              alt="Current logo"
                              className="w-20 h-20 object-contain rounded-lg border bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">Logo Active</div>
                              <div className="text-xs text-gray-500 break-all">{customizations.logo}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Text size="sm" className="text-blue-700">
                          💡 <strong>Pro Tip:</strong> If you don't have a logo, you can generate one with ChatGPT and download it, then upload it here!
                        </Text>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                  <CardContent className="p-6">
                    <Heading level={4} className="mb-6">🖼️ Custom Images</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
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
                            <div className="mt-2 space-y-2">
                              <img
                                src={customizations[option.key]}
                                alt={option.label}
                                className="w-full h-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                                <strong>Saved URL:</strong> {customizations[option.key]}
                              </div>
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
                      className="px-8 bg-green-600 text-white hover:bg-green-700"
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