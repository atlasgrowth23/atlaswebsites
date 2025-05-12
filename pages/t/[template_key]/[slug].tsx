import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { query } from '@/lib/db';
import { Company } from '@/types';
import BoldEnergyLayout from '@/components/templates/BoldEnergy/Layout';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
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
  
  // Create paths for both templates for each company slug
  const paths = [];
  for (const company of result.rows) {
    paths.push({ params: { template_key: 'boldenergy', slug: company.slug } });
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
    // Get company data
    const result = await query(
      'SELECT * FROM companies WHERE slug = $1 LIMIT 1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return { notFound: true };
    }
    
    // Check if the template exists
    if (!['boldenergy', 'moderntrust'].includes(template_key as string)) {
      return { notFound: true };
    }
    
    // Get template frames (images)
    console.log('Added template frames:', {
      hero_img: 'https://images.unsplash.com/photo-1581146783519-13333b79e6c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      about_img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80'
    });
    
    return {
      props: {
        company: JSON.parse(JSON.stringify(result.rows[0])),
        template_key,
      },
      revalidate: 60 * 10, // Revalidate every 10 minutes
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    return { notFound: true };
  }
}