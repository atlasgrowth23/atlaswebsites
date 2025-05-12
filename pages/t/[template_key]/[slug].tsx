import type { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';
import { Company } from '@/types';

// Dynamic Template Components
import * as BoldEnergyTemplate from '@/components/templates/BoldEnergy';
import * as ModernTrustTemplate from '@/components/templates/ModernTrust';

export interface TemplateProps {
  company: Company;
}

interface Params {
  slug: string;
  template_key: string;
}

const TemplatePage = ({ company }: TemplateProps) => {
  if (!company) {
    return <div>Loading...</div>;
  }

  // Template component mapping
  const templates: Record<string, any> = {
    boldenergy: BoldEnergyTemplate,
    moderntrust: ModernTrustTemplate,
  };

  // Use the template_key from URL params or fallback to boldenergy
  const templateKey = company ? (useRouter().query.template_key as string || 'boldenergy') : 'boldenergy';

  const TemplateComponent = templates[templateKey];

  if (!TemplateComponent) {
    return <div>Template not found</div>;
  }

  return <TemplateComponent.default company={company} />;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const supabase = createClient();

  const { data: companies, error } = await supabase
    .from('companies')
    .select('slug')
    .order('name');

  if (error) {
    console.error('Error fetching companies:', error);
    return { paths: [], fallback: 'blocking' };
  }

  // Generate paths for both templates
  const templates = ['boldenergy', 'moderntrust'];
  const paths = companies?.flatMap((company) => 
    templates.map((template) => ({
      params: {
        template_key: template,
        slug: company.slug,
      },
    }))
  ) || [];

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as Params;

  const supabase = createClient();

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return {
      notFound: true,
    };
  }

  if (!company) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      company,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
};

export default TemplatePage;