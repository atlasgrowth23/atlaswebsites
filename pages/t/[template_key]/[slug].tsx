import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Company, Review } from '@/types';
import { createClient } from '@/lib/supabase/client';

// Import templates using barrel files
import * as ModernTrust from '@/components/templates/BigBalls';
import * as BoldEnergy from '@/components/templates/BoldEnergy';
import * as AirStream from '@/components/templates/Airstream';
import * as BrownNeck from '@/components/templates/BrownNeck';

interface TemplatePageProps {
  company: Company;
  reviews: Review[];
  logoUrl: string | null;
  templateKey: string;
}

// Template registry - maps template keys to component sets
const templateRegistry = {
  'moderntrust': ModernTrust,
  'boldenergy': BoldEnergy,
  'airstream': AirStream,
  'brownneck': BrownNeck
};

export default function TemplatePage({ company, reviews, logoUrl, templateKey }: TemplatePageProps) {
  // Get the appropriate template components based on the template key
  const template = templateRegistry[templateKey as keyof typeof templateRegistry];

  if (!template) {
    throw new Error(`Template with key "${templateKey}" not found.`);
  }

  const { Layout } = template;
  
  // Define page metadata
  const pageTitle = `${company.name} | HVAC Services`;
  const pageDescription = company.site_company_insights_description || 
    `${company.name} provides professional heating, cooling, and air quality services for residential and commercial clients.`;

  // Create a mapping of section types to section components
  // This allows different templates to have different sections
  return (
    <Layout 
      title={pageTitle}
      description={pageDescription}
      company={company}
    >
      {/* Render all available template sections dynamically */}
      {Object.entries(template).map(([key, Component]) => {
        // Skip the Layout component as we're already using it
        if (key === 'Layout') return null;
        
        // Render other components with needed props
        return (
          <Component 
            key={key} 
            company={company} 
            reviews={key === 'Reviews' ? reviews : undefined}
          />
        );
      })}
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

  // Get company-specific frames
  const { data: companyFrames } = await supabase
    .from('company_frames')
    .select('*')
    .eq('company_id', company.id)
    .eq('template_key', templateKey);

  // Add frames to company object
  if (companyFrames && companyFrames.length > 0) {
    company.frames = {};
    companyFrames.forEach(frame => {
      company.frames[frame.frame_name] = frame.image_url;
    });
  }

  // Get template frames
  const { data: templateFrames } = await supabase
    .from('template_frames')
    .select('*')
    .eq('template_key', templateKey);

  // Add template frames to company object
  if (templateFrames && templateFrames.length > 0) {
    company.template_frames = {};
    templateFrames.forEach(frame => {
      company.template_frames[frame.frame_name] = frame.stock_url;
    });
  }

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