import React from 'react';
import { GetServerSideProps } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { Company } from '@/types';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import { processLogo } from '@/lib/processLogo';
import Head from 'next/head';
import Script from 'next/script';

type TemplateProps = {
  company: Company;
  template_key: string;
};

export default function TemplatePage({ company, template_key }: TemplateProps) {
  // Determine which template layout to use
  switch (template_key) {
    case 'moderntrust':
      return (
        <>
          <Script
            id="tracking-setup"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.__COMPANY_ID__ = "${company.id}";
                window.__TRACKING_ENABLED__ = true;
              `
            }}
          />
          <ModernTrustLayout company={company} />
        </>
      );

    default:
      return (
        <div className="p-8">
          <Head>
            <title>Template Not Found</title>
          </Head>
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <p>The requested template "{template_key}" does not exist.</p>
        </div>
      );
  }
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }
  
  const { template_key, slug } = params;
  
  try {
    // Get company data from Supabase
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (companyError || !companyData) {
      return { notFound: true };
    }
    
    // Check if the template exists
    if (!['moderntrust', 'boldenergy', 'naturalearthpro'].includes(template_key as string)) {
      return { notFound: true };
    }
    
    const company = companyData;
    
    // Get company frames and template frames from database/storage
    const { data: companyFrames } = await supabaseAdmin
      .from('company_frames')
      .select('slug, url')
      .eq('company_id', company.id);

    const { data: templateFrames } = await supabaseAdmin
      .from('frames')
      .select('slug, default_url')
      .eq('template_key', template_key);

    // Convert to objects for easy lookup
    const company_frames: Record<string, string> = {};
    companyFrames?.forEach((frame) => {
      company_frames[frame.slug] = frame.url;
    });

    const template_frames: Record<string, string> = {};
    templateFrames?.forEach((frame) => {
      template_frames[frame.slug] = frame.default_url;
    });

    // Add frame data to company
    company.company_frames = company_frames;
    company.template_frames = template_frames;
    
    // Handle logo based on predicted_label  
    if (company.predicted_label === 'logo' && company.logo_storage_path) {
      // Check if it's already a full HTTP URL (real Google logo)
      if (company.logo_storage_path.startsWith('http')) {
        company.logoUrl = company.logo_storage_path;
      } else {
        // It's a storage path, build Supabase URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        company.logoUrl = `${supabaseUrl}/storage/v1/object/public/images${company.logo_storage_path}`;
      }
    } else {
      company.logoUrl = null; // Show company name as text
    }
    
    console.log('✅ Company loaded:', company.name, 'Logo mode:', company.predicted_label);
    
    return {
      props: {
        company: JSON.parse(JSON.stringify(company)),
        template_key,
      },
      // No revalidate needed - getServerSideProps fetches fresh data on every request
    };
  } catch (error) {
    console.error('❌ Template page error:', error);
    console.error('❌ Params:', { template_key, slug });
    return { notFound: true };
  }
}