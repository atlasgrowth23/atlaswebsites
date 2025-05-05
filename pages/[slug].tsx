import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { createClient } from '@/lib/supabase/client';
import Layout from '@/components/shared/Layout';
import { Company, Review } from '@/types';

// These will be used later for the complete implementation
// import Header from '@/components/templates/TemplateHVAC1/Header';
// import Hero from '@/components/templates/TemplateHVAC1/Hero';
// import About from '@/components/templates/TemplateHVAC1/About';
// import Services from '@/components/templates/TemplateHVAC1/Services';
// import ReviewsSection from '@/components/templates/TemplateHVAC1/ReviewsSection';
// import LocationMap from '@/components/templates/TemplateHVAC1/LocationMap';
// import ContactFooter from '@/components/templates/TemplateHVAC1/ContactFooter';

interface CompanyPageProps {
  company: Company;
  reviews: Review[];
  logoUrl: string | null;
}

const CompanyPage: NextPage<CompanyPageProps> = ({ company, reviews, logoUrl }) => {
  if (!company) {
    return (
      <Layout>
        <div className="container mx-auto py-12 px-4 text-center">
          <h1 className="text-3xl font-bold">Company not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{company.name} | HVAC Services</title>
        <meta 
          name="description" 
          content={`${company.name} provides professional HVAC services in ${company.city}, ${company.state}.`} 
        />
      </Head>

      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center py-12">{company.name}</h1>
        
        {/* This is a placeholder. The actual implementation will use the component imports */}
        <div className="space-y-8 p-4">
          <section className="bg-slate-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">About {company.name}</h2>
            <p>Serving {company.city}, {company.state} with professional HVAC services.</p>
          </section>
          
          <section className="bg-slate-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.review_id} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <span className="font-medium">{review.reviewer_name}</span>
                      <span className="ml-2 text-yellow-500">{'★'.repeat(review.stars)}</span>
                    </div>
                    <p>{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No reviews available.</p>
            )}
          </section>
          
          <section className="bg-slate-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>Business ID: {company.biz_id}</p>
            <p>Location: {company.city}, {company.state}</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const supabase = createClient();
  
  // Fetch company slugs from Supabase
  const { data, error } = await supabase
    .from('companies')
    .select('slug::text as slug')
    .limit(10); // Limit during development
  
  if (error) {
    console.error('Error fetching company slugs:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
  
  // Generate paths from slugs
  const paths = data.map((company) => ({
    params: { slug: company.slug }
  }));
  
  return {
    paths,
    fallback: 'blocking' // Allows for generation of new pages on-demand
  };
};

export const getStaticProps: GetStaticProps<CompanyPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const supabase = createClient();
  
  // Fetch company data
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (companyError || !companyData) {
    console.error('Error fetching company data:', companyError);
    return {
      notFound: true
    };
  }
  
  // Fetch reviews for the company
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .eq('biz_id', companyData.biz_id)
    .eq('stars', 5) // Only 5-star reviews
    .limit(5)
    .order('published_at_date', { ascending: false });
  
  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    return {
      notFound: true
    };
  }
  
  // Determine logo URL
  const logoUrl = companyData.logo_override || companyData.logo || null;
  
  return {
    props: {
      company: companyData,
      reviews: reviewsData || [],
      logoUrl
    },
    revalidate: 3600 // Revalidate once per hour
  };
};

export default CompanyPage;
