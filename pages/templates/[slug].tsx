import React, { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { query } from '@/lib/db';
import { Company } from '@/types';
import { processLogo } from '@/lib/processLogo';

interface TemplateSelectionProps {
  company: Company;
}

const templates = [
  {
    key: 'moderntrust',
    name: 'Modern Trust',
    description: 'Professional blue styling with clean, modern design',
    preview: '/previews/moderntrust-preview.jpg',
    colors: ['#1e40af', '#3b82f6', '#60a5fa'],
    features: ['Professional Layout', 'Clean Design', 'Trust-Building']
  },
  {
    key: 'boldenergy',
    name: 'Bold Energy',
    description: 'Energetic orange and red styling with dynamic visuals',
    preview: '/previews/boldenergy-preview.jpg', 
    colors: ['#ea580c', '#dc2626', '#fbbf24'],
    features: ['High Energy', 'Dynamic Design', 'Bold Impact']
  },
  {
    key: 'naturalearthpro',
    name: 'Natural Earth Pro',
    description: 'Green and earth tones for eco-friendly businesses',
    preview: '/previews/naturalearthpro-preview.jpg',
    colors: ['#16a34a', '#15803d', '#84cc16'],
    features: ['Eco-Friendly', 'Natural Tones', 'Sustainable Feel']
  }
];

export default function TemplateSelection({ company }: TemplateSelectionProps) {
  const [feedback, setFeedback] = useState<{[key: string]: string}>({});

  const handleSendToProspect = async (templateKey: string) => {
    try {
      const response = await fetch('/api/prospect-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: company.id?.toString(),
          action: 'activate'
        })
      });
      
      if (response.ok) {
        setFeedback({
          ...feedback,
          [templateKey]: '✅ Tracking Activated! Ready to send to prospect.'
        });
        
        // Clear feedback after 4 seconds
        setTimeout(() => {
          setFeedback(prev => ({ ...prev, [templateKey]: '' }));
        }, 4000);
      }
    } catch (error) {
      console.error('Error activating tracking:', error);
      setFeedback({
        ...feedback,
        [templateKey]: '❌ Error occurred'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>{`Choose Template Style for ${company?.name || 'Business'}`}</title>
        <meta name="description" content={`Select your preferred template style for ${company?.name || 'your business'} website`} />
      </Head>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            {company.logoUrl && (
              <Image 
                src={company.logoUrl}
                alt={`${company.name} logo`}
                width={80}
                height={60}
                className="object-contain"
              />
            )}
            <h1 className="text-4xl font-bold text-gray-900">
              {company.name}
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 mb-4">
            Choose your preferred template style
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>📍 {company.city}, {company.state}</span>
            {company.phone && (
              <>
                <span>•</span>
                <span>📞 {company.phone}</span>
              </>
            )}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {templates.map((template) => (
            <div
              key={template.key}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Preview Image */}
              <div className="relative h-48 bg-gradient-to-br" style={{
                background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]}, ${template.colors[2]})`
              }}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold mb-2">{template.name}</div>
                    <div className="text-sm opacity-90">Preview Style</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {template.name}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {template.description}
                </p>

                {/* Color Palette */}
                <div className="flex gap-2 mb-4">
                  {template.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>

                {/* Features */}
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Features:</div>
                  <div className="flex flex-wrap gap-2">
                    {template.features.map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feedback Message */}
                {feedback[template.key] && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    {feedback[template.key]}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link 
                    href={`/t/${template.key}/${company.slug}`}
                    className="block w-full text-center py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})`
                    }}
                  >
                    Preview {template.name} Style
                  </Link>
                  
                  <button
                    onClick={() => handleSendToProspect(template.key)}
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    🚀 Send This Style to Prospect
                  </button>
                  
                  <button
                    onClick={(event) => {
                      const url = `${window.location.origin}/t/${template.key}/${company.slug}`;
                      navigator.clipboard.writeText(url).then(() => {
                        // Show success feedback
                        const button = event.target as HTMLButtonElement;
                        const originalText = button.textContent;
                        button.textContent = 'Copied!';
                        button.style.backgroundColor = '#10b981';
                        setTimeout(() => {
                          button.textContent = originalText;
                          button.style.backgroundColor = '';
                        }, 2000);
                      });
                    }}
                    className="w-full py-2 px-4 border-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md"
                    style={{
                      borderColor: template.colors[0],
                      color: template.colors[0]
                    }}
                  >
                    📋 Copy Link Only
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Main */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to All Businesses
          </Link>
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const result = await query('SELECT slug FROM companies WHERE slug IS NOT NULL');
    const companies = result.rows || [];
    
    const paths = companies.map((company: any) => ({
      params: { slug: company.slug }
    }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params!;

  try {
    const result = await query('SELECT * FROM companies WHERE slug = $1', [slug]);
    const company = result.rows?.[0];

    if (!company) {
      return {
        notFound: true
      };
    }

    // Process logo
    const logoUrl = await processLogo(company.slug, company.logo);

    const processedCompany = {
      ...company,
      logoUrl,
      company_frames: company.company_frames || {},
      template_frames: company.template_frames || {}
    };

    return {
      props: {
        company: processedCompany
      },
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    return {
      notFound: true
    };
  }
};