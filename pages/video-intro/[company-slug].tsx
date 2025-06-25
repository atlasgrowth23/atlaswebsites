import React from 'react';
import { GetServerSideProps } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { Company } from '@/types';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import Head from 'next/head';
import Script from 'next/script';

type VideoIntroProps = {
  company: Company;
  videoData: {
    videoId: string;
    videoLink: string;
    videoPreview: string;
    firstName: string;
    lastName: string;
  };
};

// Video mapping for our test companies
const VIDEO_MAPPING = {
  'ready-heating-and-air-llc': {
    videoId: 'n7b7b7cf2w1',
    videoLink: 'https://app.repliq.co/videos/n7b7b7cf2w1',
    videoPreview: 'https://app.repliq.co/medias/n7b7b7cf2w1',
    firstName: 'John',
    lastName: 'Rangan'
  },
  'calderas-heating-and-air': {
    videoId: 'n799e78ebw1',
    videoLink: 'https://app.repliq.co/videos/n799e78ebw1',
    videoPreview: 'https://app.repliq.co/medias/n799e78ebw1',
    firstName: 'Sarah',
    lastName: 'Acker'
  },
  'toms-heating-and-air-conditioning': {
    videoId: 'n71ea2cc4w1',
    videoLink: 'https://app.repliq.co/videos/n71ea2cc4w1',
    videoPreview: 'https://app.repliq.co/medias/n71ea2cc4w1',
    firstName: 'Robert',
    lastName: 'Suun'
  }
};

export default function VideoIntroPage({ company, videoData }: VideoIntroProps) {
  return (
    <>
      <Head>
        <title>Personal Introduction for {company.name}</title>
        <meta name="description" content={`A personal video introduction and website demo for ${company.name}`} />
      </Head>
      
      <Script
        id="tracking-setup"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.__COMPANY_ID__ = "${company.id}";
            window.__TRACKING_ENABLED__ = true;
            window.__VIDEO_INTRO_MODE__ = true;
          `
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Video Introduction Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hi {company.name}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                I created a website for you and recorded a quick walkthrough
              </p>
            </div>

            {/* Video Player */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <iframe
                  src={videoData.videoLink}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Personal message from {videoData.firstName} {videoData.lastName}
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-blue-800 font-medium">
                    Your website is live below ↓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Website */}
        <div className="bg-white">
          <ModernTrustLayout company={company} />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  if (!params) {
    return { notFound: true };
  }
  
  const { 'company-slug': companySlug } = params;
  
  try {
    // Get company data from Supabase
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('slug', companySlug)
      .single();
    
    if (companyError || !companyData) {
      return { notFound: true };
    }

    // Check if we have video data for this company
    const videoData = VIDEO_MAPPING[companySlug as keyof typeof VIDEO_MAPPING];
    if (!videoData) {
      return { notFound: true };
    }
    
    const company = companyData;
    
    // Get company frames and template frames from database/storage
    const { data: companyFrames } = await supabaseAdmin
      .from('company_frames')
      .select('slug, url')
      .eq('company_id', company.id);

    const { data: templateFrames } = await supabaseAdmin
      .from('frames')
      .select('slug, default_url')
      .eq('template_key', 'moderntrust'); // Always use moderntrust for video intros

    // Convert to objects for easy lookup
    const company_frames: Record<string, string> = {};
    companyFrames?.forEach((frame) => {
      company_frames[frame.slug] = frame.url;
    });

    const template_frames: Record<string, string> = {};
    templateFrames?.forEach((frame) => {
      template_frames[frame.slug] = frame.default_url;
    });

    // Add frame data to company
    company.company_frames = company_frames;
    company.template_frames = template_frames;
    
    // Handle logo based on predicted_label  
    if (company.predicted_label === 'logo' && company.logo_storage_path) {
      if (company.logo_storage_path.startsWith('http')) {
        company.logoUrl = company.logo_storage_path;
      } else {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        company.logoUrl = `${supabaseUrl}/storage/v1/object/public/images${company.logo_storage_path}`;
      }
    } else {
      company.logoUrl = null;
    }
    
    console.log('✅ Video intro page loaded:', company.name, 'Video:', videoData.videoId);
    
    return {
      props: {
        company: JSON.parse(JSON.stringify(company)),
        videoData,
      },
    };
  } catch (error) {
    console.error('❌ Video intro page error:', error);
    console.error('❌ Params:', { companySlug });
    return { notFound: true };
  }
};