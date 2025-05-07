import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Company, Review } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Import templates using barrel files
import * as TemplateHVAC1 from '@/components/templates/TemplateHVAC1';
import * as ModernTrust from '@/components/templates/ModernTrust';
import * as BoldEnergy from '@/components/templates/BoldEnergy';

interface TemplatePageProps {
  company: Company;
  reviews: Review[];
  logoUrl: string | null;
  templateKey: string;
}

// Template registry - maps template keys to component sets
const templateRegistry = {
  'hvac1': TemplateHVAC1,
  'moderntrust': ModernTrust,
  'boldenergy': BoldEnergy
};

export default function TemplatePage({ company, reviews, logoUrl, templateKey }: TemplatePageProps) {
  // Get the appropriate template components based on the template key
  const template = templateRegistry[templateKey as keyof typeof templateRegistry] || templateRegistry.hvac1;
  
  const { Layout, Hero, About } = template;
  
  const pageTitle = `${company.name} | HVAC Services`;
  const pageDescription = company.site_company_insights_description || 
    `${company.name} provides professional heating, cooling, and air quality services for residential and commercial clients.`;

  return (
    <Layout 
      title={pageTitle}
      description={pageDescription}
      company={company}
    >
      <Hero company={company} />
      <About company={company} />
      {/* Other components can be added here */}
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const supabase = createClient();
  const { data: companies } = await supabase.from('companies').select('slug');
  
  // Get templates to generate paths for
  const templateKeys = Object.keys(templateRegistry);
  
  // Generate paths for each company with each template
  const paths = companies?.flatMap(company => 
    templateKeys.map(templateKey => ({
      params: { 
        slug: company.slug || '',
        template_key: templateKey 
      }
    }))
  ) || [];

  return {
    paths,
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps<TemplatePageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const templateKey = params?.template_key as string;
  
  // Check if template key exists in registry
  if (!templateRegistry[templateKey as keyof typeof templateRegistry]) {
    return {
      notFound: true
    };
  }
  
  const supabase = createClient();
  
  // Get company data
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (!company) {
    return {
      notFound: true
    };
  }
  
  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('biz_id', company.biz_id)
    .order('published_at_date', { ascending: false })
    .limit(10);
  
  // Get logo URL
  let logoUrl = company.logo || null;
  
  // If logo_override is set, use that instead
  if (company.logo_override) {
    logoUrl = company.logo_override;
  }
  
  return {
    props: {
      company,
      reviews: reviews || [],
      logoUrl,
      templateKey
    },
    revalidate: 3600 // Revalidate every hour
  };
};