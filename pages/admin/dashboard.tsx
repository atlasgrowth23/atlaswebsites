import { GetServerSideProps } from 'next';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { getAllCompanies } from '@/lib/supabase-db';

// Import the existing working dashboard component logic
import WorkingDashboard from '../working-dashboard';

interface CompanyWithTracking {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone?: string;
  email_1?: string;
  site?: string;
  reviews_link?: string;
  rating?: number;
  reviews?: number;
  r_30?: number;
  r_60?: number;
  r_90?: number;
  r_365?: number;
  tracking_enabled?: boolean;
  tracking_paused?: boolean;
  company_frames?: {
    hero_img?: string;
    hero_img_2?: string;
    about_img?: string;
    logo_url?: string;
  };
}

interface AdminDashboardProps {
  companies: CompanyWithTracking[];
}

export default function AdminDashboard({ companies }: AdminDashboardProps) {
  return (
    <AdminLayout currentPage="dashboard">
      <Head>
        <title>Admin Dashboard - HVAC Lead Management</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Business Analytics & Tracking</h2>
          <p className="text-gray-600">Monitor website performance and manage template customization</p>
        </div>
        
        {/* Use the existing working dashboard component */}
        <WorkingDashboard companies={companies} />
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const companies = await getAllCompanies(1000);
    
    // Filter for Alabama and Arkansas
    const filteredCompanies = companies
      .filter(company => company.state === 'Alabama' || company.state === 'Arkansas')
      .sort((a, b) => {
        if (a.state !== b.state) return a.state!.localeCompare(b.state!);
        if (a.city !== b.city) return (a.city || '').localeCompare(b.city || '');
        return a.name.localeCompare(b.name);
      });

    // Map companies with safe serialization
    const companiesWithTracking = filteredCompanies.map((company: any) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      city: company.city || null,
      state: company.state || null,
      phone: company.phone || null,
      email_1: company.email_1 || null,
      site: company.site || null,
      reviews_link: company.reviews_link || null,
      rating: company.rating || null,
      reviews: company.reviews || null,
      r_30: company.r_30 || null,
      r_60: company.r_60 || null,
      r_90: company.r_90 || null,
      r_365: company.r_365 || null,
      tracking_enabled: company.tracking_enabled || false,
      tracking_paused: company.tracking_paused || false,
      company_frames: company.company_frames || null,
    }));

    return {
      props: {
        companies: companiesWithTracking,
      },
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      props: {
        companies: [],
      },
    };
  }
};