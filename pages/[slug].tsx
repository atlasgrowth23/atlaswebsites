import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Company } from '@/types';
import { processLogo } from '@/lib/processLogo';

// This page now redirects to the template-based URL structure
export default function RedirectPage({ company }: { company: Company }) {
  const router = useRouter();

  useEffect(() => {
    // Randomly select between available templates
    const templates = ['boldenergy', 'moderntrust'];
    const templateKey = templates[Math.floor(Math.random() * templates.length)];

    if (router.isReady && company?.slug) {
      router.replace(`/t/${templateKey}/${company.slug}`);
    }
  }, [router, company]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecting to new page format...</p>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Skip pre-generating paths during build to avoid database connection issues
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    // Fetch company data from Supabase
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !company) {
      return {
        notFound: true,
      };
    }

    // Process company logo
    const logoUrl = await processLogo(company.slug, company.logo);
    company.logoUrl = logoUrl;

    return {
      props: {
        company,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (err) {
    console.error('Error fetching company data:', err);
    return {
      notFound: true,
    };
  }
};