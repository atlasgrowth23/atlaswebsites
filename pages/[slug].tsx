import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { createClient } from '@/lib/supabase/client';
import Layout from '@/components/shared/Layout';
import Header from '@/components/templates/TemplateHVAC1/Header';
import Hero from '@/components/templates/TemplateHVAC1/Hero';
import Services from '@/components/templates/TemplateHVAC1/Services';
import About from '@/components/templates/TemplateHVAC1/About';
import ReviewsSection from '@/components/templates/TemplateHVAC1/ReviewsSection';
import LocationMap from '@/components/templates/TemplateHVAC1/LocationMap';
import ContactFooter from '@/components/templates/TemplateHVAC1/ContactFooter';
import { Company, Review } from '@/types';

interface CompanyPageProps {
  company: Company;
  reviews: Review[];
  logoUrl: string | null;
}

export default function CompanyPage({ company, reviews, logoUrl }: CompanyPageProps) {
  if (!company) {
    return <div>Company not found</div>;
  }

  const title = `${company.name} | HVAC Services in ${company.city}, ${company.state}`;
  const description = company.description || 
    `${company.name} provides professional HVAC services in ${company.city}, ${company.state}. 
    Contact us today for heating, cooling, and ventilation solutions.`;

  return (
    <Layout title={title} description={description}>
      <Header company={company} logoUrl={logoUrl} />
      <Hero company={company} />
      <Services company={company} />
      <About company={company} />
      <ReviewsSection reviews={reviews} companyName={company.name} />
      <LocationMap company={company} />
      <ContactFooter company={company} />
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Connect to Supabase and fetch all company slugs
  const supabase = createClient();
  const { data: companies, error } = await supabase
    .from('companies')
    .select('slug');

  if (error) {
    console.error('Error fetching companies:', error);
    return {
      paths: [],
      fallback: false,
    };
  }

  // Create paths for each company slug
  const paths = companies?.map((company) => ({
    params: { slug: company.slug },
  })) || [];

  return {
    paths,
    fallback: 'blocking', // Show a loading state until the page is generated
  };
};

export const getStaticProps: GetStaticProps<CompanyPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  
  // Connect to Supabase
  const supabase = createClient();
  
  // Fetch company data by slug
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (companyError || !company) {
    console.error('Error fetching company:', companyError);
    return {
      notFound: true,
    };
  }

  // Fetch reviews for this company
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('biz_id', company.biz_id)
    .order('published_at_date', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    // Continue without reviews
  }

  // Get company logo from Supabase Storage if it exists
  let logoUrl = null;
  if (company.logo_override) {
    logoUrl = company.logo_override;
  } else if (company.logo) {
    const { data: logoData } = await supabase
      .storage
      .from('company-logos')
      .getPublicUrl(company.logo);
    
    logoUrl = logoData?.publicUrl || null;
  }

  return {
    props: {
      company,
      reviews: reviews || [],
      logoUrl,
    },
    // Revalidate the page every hour (3600 seconds)
    revalidate: 3600,
  };
};