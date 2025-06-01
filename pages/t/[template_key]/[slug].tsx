import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { supabase } from '@/lib/supabase';
import { Company } from '@/types';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import { processLogo } from '@/lib/processLogo';
import Head from 'next/head';

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
          <Head>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.__COMPANY_ID__ = "${company.id}";`
              }}
            />
          </Head>
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

export const getStaticPaths: GetStaticPaths = async () => {
  // Skip pre-generating paths during build to avoid database connection issues
  // All pages will be generated on-demand with fallback: 'blocking'
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }
  
  const { template_key, slug } = params;
  
  try {
    // Get company data from Supabase
    const { data: companyData, error: companyError } = await supabase
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
    
    // Get company-specific frames
    const { data: companyFrames } = await supabase
      .from('company_frames')
      .select('slug, url')
      .eq('company_id', company.id);

    // Get default frames for this specific template
    const { data: templateFrames } = await supabase
      .from('frames')
      .select('slug, default_url')
      .eq('template_key', template_key);

    // Convert to objects for easier lookup
    const company_frames: Record<string, string> = {};
    companyFrames?.forEach((frame) => {
      company_frames[frame.slug] = frame.url;
    });

    const template_frames: Record<string, string> = {};
    templateFrames?.forEach((frame) => {
      template_frames[frame.slug] = frame.default_url;
    });

    // Add frames to company object
    company.company_frames = company_frames;
    company.template_frames = template_frames;
    
    // Use logo URL directly from frames or company data - no processing during render
    company.logoUrl = company_frames['logo_url'] || company.logo;
    
    // Log what frames we're using
    console.log('Company ID:', company.id);
    console.log('Added company frames:', company_frames);
    console.log('Added template frames:', template_frames);
    console.log('Logo URL:', company.logoUrl);
    
    return {
      props: {
        company: JSON.parse(JSON.stringify(company)),
        template_key,
      },
      revalidate: 60 * 10, // Revalidate every 10 minutes
    };
  } catch (error) {
    console.error('❌ Template page error:', error);
    console.error('❌ Params:', { template_key, slug });
    return { notFound: true };
  }
}