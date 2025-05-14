import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { query } from '@/lib/db';
import { Company } from '@/types';
import BoldEnergyLayout from '@/components/templates/BoldEnergy/Layout';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import PremiumServiceLayout from '@/components/templates/PremiumService/Layout';
import Hero from '@/components/templates/BoldEnergy/Hero';
import About from '@/components/templates/BoldEnergy/About';
import Head from 'next/head';

type TemplateProps = {
  company: Company;
  template_key: string;
};

export default function TemplatePage({ company, template_key }: TemplateProps) {
  // Determine which template layout to use
  switch (template_key) {
    case 'boldenergy':
      return (
        <BoldEnergyLayout company={company} title={`${company.name} | HVAC Services`}>
          <Hero company={company} />
          <About company={company} />
        </BoldEnergyLayout>
      );
    case 'moderntrust':
      return <ModernTrustLayout company={company} />;
    case 'premiumservice':
      return <PremiumServiceLayout company={company} title={`${company.name} | Professional HVAC Services`} />;
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
  
  // Create paths for all templates for each company slug
  const paths = [];
  for (const company of result.rows) {
    paths.push({ params: { template_key: 'boldenergy', slug: company.slug } });
    paths.push({ params: { template_key: 'moderntrust', slug: company.slug } });
    paths.push({ params: { template_key: 'premiumservice', slug: company.slug } });
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
    // Get company data
    const result = await query(
      'SELECT * FROM companies WHERE slug = $1 LIMIT 1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return { notFound: true };
    }
    
    // Check if the template exists
    if (!['boldenergy', 'moderntrust', 'premiumservice'].includes(template_key as string)) {
      return { notFound: true };
    }
    
    const company = result.rows[0];
    
    // Get company-specific frames
    const companyFramesResult = await query(
      'SELECT frame_name as frame_key, image_url FROM frames WHERE company_id = $1 AND template_key = $2',
      [slug, template_key]
    );

    // Get template frames
    const templateFramesResult = await query(
      'SELECT frame_key, image_url FROM template_frames WHERE template_key = $1',
      [template_key]
    );

    // Convert to objects for easier lookup
    const company_frames = {};
    companyFramesResult.rows.forEach((frame) => {
      company_frames[frame.frame_key] = frame.image_url;
    });

    const template_frames = {};
    templateFramesResult.rows.forEach((frame) => {
      template_frames[frame.frame_key] = frame.image_url;
    });

    // Add frames to company object
    company.company_frames = company_frames;
    company.template_frames = template_frames;
    
    // Log what frames we're using
    console.log('Added template frames:', template_frames);
    
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