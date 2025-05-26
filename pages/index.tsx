import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Company } from '@/types';
import { queryMany } from '@/lib/db';

interface TrackingData {
  company_id: string;
  tracking_enabled: boolean;
  total_views: number;
  template_views: Record<string, number>;
  last_viewed_at: string;
  activated_at: string;
  name: string;
  slug: string;
}

interface HomeProps {
  companies: Company[];
  trackingData: TrackingData[];
}

const Home: NextPage<HomeProps> = ({ companies, trackingData: initialTrackingData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState(companies);
  const [trackingData, setTrackingData] = useState(initialTrackingData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredCompanies(companies);
      return;
    }
    
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(term) || 
      (company.city && company.city.toLowerCase().includes(term)) || 
      (company.state && company.state.toLowerCase().includes(term))
    );
    
    setFilteredCompanies(filtered);
  };

  const handleTrackingToggle = async (companyId: string, action: 'activate' | 'deactivate') => {
    try {
      const response = await fetch('/api/prospect-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action })
      });
      
      if (response.ok) {
        // Refresh tracking data
        const trackingResponse = await fetch('/api/prospect-tracking');
        const data = await trackingResponse.json();
        setTrackingData(data.trackingData);
      }
    } catch (error) {
      console.error('Error toggling tracking:', error);
    }
  };

  const getTrackingInfo = (companyId: string) => {
    return trackingData.find(t => t.company_id === companyId);
  };

  return (
    <>
      <Head>
        <title>HVAC Company Websites | Static Site Generator</title>
        <meta name="description" content="Generate static websites for HVAC contractors with our Next.js-based static site generator." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Static Websites for HVAC Contractors
            </h1>
            <p className="text-xl mb-8">
              Generate professional, high-performance websites for HVAC businesses with our static site generator.
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies by name or location..."
                  className="w-full px-5 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <div className="absolute right-3 top-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            {searchTerm ? 'Search Results' : 'Featured HVAC Companies'}
          </h2>
          
          {filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <div key={company.id || company.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{company.name}</h3>
                    <p className="text-gray-600 mb-4">
                      {company.city ? company.city : ''}
                      {company.city && company.state ? ', ' : ''}
                      {company.state ? company.state : ''}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        HVAC Services
                      </div>
                      <Link href={`/templates/${company.slug}`} passHref>
                        <Button size="sm">Choose Style</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No companies found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About This Project</h2>
            <p className="text-lg mb-8">
              This is a Static Site Generator built with Next.js that creates optimized, 
              high-performance websites for HVAC contractors. Each site is statically 
              generated at build time and deployed as standalone HTML, CSS, and JavaScript.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="bg-primary">Learn More</Button>
              <Button variant="outline">View Documentation</Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} HVAC Static Site Generator. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export async function getStaticProps() {
  try {
    // Fetch only the first 50 companies for better performance
    const companies = await queryMany(`
      SELECT id, slug, name, city, state 
      FROM companies 
      ORDER BY name
      LIMIT 50
    `);

    return {
      props: {
        companies: companies || [],
      },
      // Revalidate the page every hour (3600 seconds)
      revalidate: 3600,
    };
  } catch (err) {
    console.error('Unexpected error fetching companies:', err);
    return {
      props: {
        companies: [],
      },
    };
  }
}

export default Home;