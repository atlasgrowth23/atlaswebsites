import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Company } from '@/types';

// This page now redirects to the template-based URL structure
export default function RedirectPage({ company }: { company: Company }) {
  const router = useRouter();

  useEffect(() => {
    // Default to BoldEnergy template
    const templateKey = 'boldenergy';

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
  const supabase = createClient();
  const { data: companies } = await supabase.from('companies').select('slug');

  const paths = companies?.map((company) => ({
    params: { slug: company.slug },
  })) || [];

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const supabase = createClient();

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!company) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      company,
    },
    revalidate: 3600,
  };
};