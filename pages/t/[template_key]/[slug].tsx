import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { query } from '@/lib/db';
import { Company } from '@/types';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import ComfortClassicLayout from '@/components/templates/ComfortClassic/Layout';
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
    case 'comfort-classic':
    case 'comfortclassic':
      return <ComfortClassicLayout company={company} />;
    case 'boldenergy':
      // Fallback to ModernTrust for now, can add new templates later
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
  try {
    // Get all companies
    const result = await query('SELECT slug FROM companies WHERE slug IS NOT NULL LIMIT 100');
    
    // Create paths for our templates for each company slug
    const paths = [];
    
    if (result && result.rows) {
      for (const company of result.rows) {
        paths.push({ params: { template_key: 'moderntrust', slug: company.slug } });
        paths.push({ params: { template_key: 'boldenergy', slug: company.slug } });
        paths.push({ params: { template_key: 'comfortclassic', slug: company.slug } });
      }
    }
    
    return {
      paths,
      fallback: 'blocking', // Show 404 for unknown paths
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
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
    
    if (!result || result.rows.length === 0) {
      return { notFound: true };
    }
    
    // Check if the template exists
    const validTemplates = ['moderntrust', 'boldenergy', 'comfort-classic', 'comfortclassic'];
    if (!validTemplates.includes(template_key as string)) {
      return { notFound: true };
    }
    
    const company = result.rows[0];
    
    // Initialize empty frames objects (since we dropped those tables)
    company.company_frames = {};
    company.template_frames = {};
    
    // Log what frames we're using
    console.log('Added template frames:', {});
    
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