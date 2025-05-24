import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { queryOne, queryMany } from '@/lib/db';
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
  try {
    // Fetch all company slugs from Replit PostgreSQL
    const companies = await queryMany(`SELECT slug FROM companies`);

    const paths = companies?.map((company) => ({
      params: { slug: company.slug },
    })) || [];

    return {
      paths,
      fallback: 'blocking',
    };
  } catch (err) {
    console.error('Error fetching company slugs:', err);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  try {
    // Fetch company data from Replit PostgreSQL
    const company = await queryOne(`
      SELECT * FROM companies WHERE slug = $1
    `, [slug]);

    if (!company) {
      return {
        notFound: true,
      };
    }

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