import type { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import { queryMany, queryOne } from '@/lib/db';
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
  try {
    // Fetch all companies using PostgreSQL
    const companies = await queryMany(`
      SELECT slug FROM companies ORDER BY name
    `);

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
  } catch (err) {
    console.error('Error fetching companies for paths:', err);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug, template_key } = params as Params;

  try {
    // Fetch company data
    const company = await queryOne(`
      SELECT * FROM companies WHERE slug = $1
    `, [slug]);

    if (!company) {
      return {
        notFound: true,
      };
    }
    
    // Fetch template frames from frames table
    const templateFrames = await queryMany(`
      SELECT frame_name, image_url 
      FROM frames 
      WHERE template_key = $1 
      AND company_id IS NULL
    `, [template_key]);
    
    // Convert frames array to object format for easy lookup
    if (templateFrames && templateFrames.length > 0) {
      const frameObj = templateFrames.reduce((acc: any, frame: any) => {
        acc[frame.frame_name] = frame.image_url;
        return acc;
      }, {});
      
      // Add template frames to company object
      company.template_frames = frameObj;
      console.log('Added template frames:', frameObj);
    }

    // Fetch any company-specific frames that might override template frames
    const companyFrames = await queryMany(`
      SELECT frame_name, image_url 
      FROM frames 
      WHERE company_id = $1
    `, [company.id]);
    
    // Add any company-specific frames
    if (companyFrames && companyFrames.length > 0) {
      const frameObj = companyFrames.reduce((acc: any, frame: any) => {
        acc[frame.frame_name] = frame.image_url;
        return acc;
      }, {});
      
      // Add company frames to company object
      company.frames = frameObj;
      console.log('Added company frames:', frameObj);
    }

    return {
      props: {
        company,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (err) {
    console.error('Error in getStaticProps:', err);
    return {
      notFound: true,
    };
  }
};

export default TemplatePage;