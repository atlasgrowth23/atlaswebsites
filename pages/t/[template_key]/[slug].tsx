import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { query } from '@/lib/db';
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
      return <ModernTrustLayout company={company} />;
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
  // Get all companies
  const result = await query('SELECT slug FROM companies WHERE slug IS NOT NULL LIMIT 100');
  
  // Create paths for our templates for each company slug
  const paths = [];
  for (const company of result.rows) {
    paths.push({ params: { template_key: 'moderntrust', slug: company.slug } });
  }
  
  return {
    paths,
    fallback: 'blocking', // Show 404 for unknown paths
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }
  
  const { template_key, slug } = params;
  
  try {
    // Get company data with additional fields for review and map display
    const result = await query(
      'SELECT * FROM companies WHERE slug = $1 LIMIT 1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return { notFound: true };
    }
    
    // Check if the template exists
    if (!['moderntrust'].includes(template_key as string)) {
      return { notFound: true };
    }
    
    const company = result.rows[0];
    
    // Get company-specific frames
    const companyFramesResult = await query(
      'SELECT slug as frame_key, url as image_url FROM company_frames WHERE company_id = $1',
      [company.id]
    );

    // Get default frames for this specific template
    const templateFramesResult = await query(
      'SELECT slug as frame_key, default_url as image_url FROM frames WHERE template_key = $1',
      [template_key]
    );

    // Convert to objects for easier lookup
    const company_frames: Record<string, string> = {};
    companyFramesResult.rows.forEach((frame) => {
      company_frames[frame.frame_key] = frame.image_url;
    });

    const template_frames: Record<string, string> = {};
    templateFramesResult.rows.forEach((frame) => {
      template_frames[frame.frame_key] = frame.image_url;
    });

    // Add frames to company object
    company.company_frames = company_frames;
    company.template_frames = template_frames;
    
    // Process company logo
    const logoUrl = await processLogo(company.slug, company.logo);
    company.logoUrl = logoUrl;
    
    // Log what frames we're using
    console.log('Company ID:', company.id);
    console.log('Added company frames:', company_frames);
    console.log('Added template frames:', template_frames);
    console.log('Processed logo URL:', logoUrl);
    
    return {
      props: {
        company: JSON.parse(JSON.stringify(company)),
        template_key,
      },
      revalidate: 60 * 10, // Revalidate every 10 minutes
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    return { notFound: true };
  }
}