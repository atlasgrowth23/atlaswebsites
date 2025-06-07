import React, { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { getCompanyBySlug, getAllCompanies } from '@/lib/supabase-db';
import { Company } from '@/types';
import { processLogo } from '@/lib/processLogo';

interface CompanyDetailProps {
  company: Company;
}

export default function CompanyDetail({ company }: CompanyDetailProps) {
  return (
    <>
      <Head>
        <title>{company.name} - Company Details</title>
        <meta name="description" content={`Details for ${company.name}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <Link href="/business-dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Company Information</h3>
                <div className="space-y-2">
                  <p><strong>Location:</strong> {company.city}, {company.state}</p>
                  {company.phone && <p><strong>Phone:</strong> {company.phone}</p>}
                  {company.email_1 && <p><strong>Email:</strong> {company.email_1}</p>}
                  <p><strong>Slug:</strong> {company.slug}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-3">
                  <Link 
                    href={`/template-editor?slug=${company.slug}`}
                    className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded hover:bg-purple-700 font-semibold"
                  >
                    🏢 Upload Logo & Edit Template
                  </Link>
                  <Link 
                    href={`/templates/${company.slug}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Select Template
                  </Link>
                  <Link 
                    href={`/t/moderntrust/${company.slug}`}
                    target="_blank"
                    className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700"
                  >
                    View Live Site
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-semibold mb-4">Available Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['moderntrust', 'boldenergy', 'naturalearthpro'].map((template) => (
                <div key={template} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold capitalize mb-2">{template.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <div className="space-y-2">
                    <Link 
                      href={`/t/${template}/${company.slug}`}
                      target="_blank"
                      className="block w-full bg-blue-600 text-white text-center py-2 px-3 rounded hover:bg-blue-700 text-sm"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const slug = params?.slug as string;

    // Get company data using Supabase
    const company = await getCompanyBySlug(slug);

    if (!company) {
      return {
        notFound: true,
      };
    }

    // Process logo
    const logoUrl = await processLogo(company.slug, company.logo || null);
    (company as any).logoUrl = logoUrl;

    return {
      props: {
        company,
      },
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    return {
      notFound: true,
    };
  }
};