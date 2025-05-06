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

  const title = `${company.name} | HVAC Services${company.city ? ` in ${company.city}` : ''}${company.state ? `, ${company.state}` : ''}`;
  const description = company.site_company_insights_description || 
    `${company.name} provides professional HVAC services${company.city ? ` in ${company.city}` : ''}${company.state ? `, ${company.state}` : ''}. 
    Contact us today for heating, cooling, and ventilation solutions.`;

  // Fix for invalid logo sources - check for common placeholder or invalid values
  const isValidLogoUrl = logoUrl && 
    logoUrl !== "Yes" && 
    logoUrl !== "No" && 
    !logoUrl.includes('googleusercontent.com/s/0');  // Filter out generic Google profile images
  
  // Only use logoUrl if it's valid, otherwise pass null to show text
  const safeLogoUrl = isValidLogoUrl ? logoUrl : null;

  return (
    <Layout title={title} description={description} company={company}>
      <Header company={company} logoUrl={safeLogoUrl} />
      <Hero company={company} heroImageUrl={'/images/default-hero.jpg'} />
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
  
  // For debugging
  console.log('Company data:', JSON.stringify(company));
  
  // For logo handling, first check if logo_override is a URL
  if (company.logo_override && company.logo_override !== "Yes" && company.logo_override !== "No") {
    // If logo_override is a URL, use it directly
    logoUrl = company.logo_override;
    
    // Clean up Google image URL parameters if present (remove /s44-p-k-no-ns-nd/ or similar parts)
    if (logoUrl.includes('googleusercontent.com')) {
      // Replace segments like /s44-p-k-no-ns-nd/ with a single /
      logoUrl = logoUrl.replace(/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\//g, '/');
    }
  } else if (company.logo && company.logo !== "Yes" && company.logo !== "No") {
    // If no valid logo_override but we have a logo
    
    // Check if logo is already a complete URL (like Google URLs)
    if (company.logo.startsWith('http')) {
      logoUrl = company.logo;
      
      // Clean up Google image URL parameters if present
      if (logoUrl.includes('googleusercontent.com')) {
        // Remove parameters like s44-p-k-no-ns-nd
        logoUrl = logoUrl.replace(/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\//g, '/');
      }
    } else {
      // Get from Supabase storage if it's not a URL
      const { data: logoData } = await supabase
        .storage
        .from('company-logos')
        .getPublicUrl(company.logo);
      
      logoUrl = logoData?.publicUrl || null;
    }
  } else {
    // If we don't have a valid logo URL, set to null
    logoUrl = null;
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