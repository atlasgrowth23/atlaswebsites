import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { Company } from '@/types';
import ModernTrustLayout from '@/components/templates/ModernTrust/Layout';
import Head from 'next/head';
import Script from 'next/script';

// Declare global types for GoHighLevel chat widget
declare global {
  interface Window {
    GOHIGHLEVEL_CHAT?: {
      open: () => void;
      close: () => void;
    };
  }
}

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
  // Alabama Test Companies
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
  },
  // Arkansas Test Companies
  'chill-factor-mechanical': {
    videoId: 'n7b7b7cf2w1',
    videoLink: 'https://app.repliq.co/videos/n7b7b7cf2w1',
    videoPreview: 'https://app.repliq.co/medias/n7b7b7cf2w1',
    firstName: 'John',
    lastName: 'Rangan'
  },
  'airpro': {
    videoId: 'n799e78ebw1',
    videoLink: 'https://app.repliq.co/videos/n799e78ebw1',
    videoPreview: 'https://app.repliq.co/medias/n799e78ebw1',
    firstName: 'Sarah',
    lastName: 'Acker'
  },
  'hook-mechanical-llc': {
    videoId: 'n71ea2cc4w1',
    videoLink: 'https://app.repliq.co/videos/n71ea2cc4w1',
    videoPreview: 'https://app.repliq.co/medias/n71ea2cc4w1',
    firstName: 'Robert',
    lastName: 'Suun'
  }
};

export default function VideoIntroPage({ company, videoData }: VideoIntroProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [buttonsClicked, setButtonsClicked] = useState<string[]>([]);

  // Track page visit when component loads
  useEffect(() => {
    trackAction('page_visited');
  }, []);

  // Track actions to GoHighLevel via webhooks
  const trackAction = async (actionType: string, actionData: any = {}) => {
    try {
      const webhookData = {
        event_type: actionType,
        company_name: company.name,
        phone_number: company.phone || '205-500-5170',
        company_slug: company.slug,
        timestamp: new Date().toISOString(),
        ...actionData
      };

      // Choose webhook URL based on action type
      let webhookUrl;
      if (actionType === 'page_visited') {
        webhookUrl = 'https://services.leadconnectorhq.com/hooks/Kz9gRUIFnAzpRHvH2nB0/webhook-trigger/99307dea-9487-46ea-8282-bc0af2fa1004';
      } else if (actionType === 'video_clicked') {
        webhookUrl = 'https://services.leadconnectorhq.com/hooks/Kz9gRUIFnAzpRHvH2nB0/webhook-trigger/61051df1-0b1f-49a2-b07a-d52c60b1a368';
      } else {
        // button_clicked uses the new webhook
        webhookUrl = 'https://services.leadconnectorhq.com/hooks/Kz9gRUIFnAzpRHvH2nB0/webhook-trigger/a8ba3982-83f7-4803-81b3-79e16fb956e8';
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      console.log('✅ Webhook sent:', actionType, 'to', webhookUrl);
    } catch (error) {
      console.error('❌ Error sending webhook:', error);
    }
  };

  const handleActionClick = async (buttonType: string, buttonText: string) => {
    // Track which buttons have been clicked
    if (!buttonsClicked.includes(buttonType)) {
      setButtonsClicked([...buttonsClicked, buttonType]);
      await trackAction('button_clicked', { button_type: buttonType, button_text: buttonText });
    }

    switch (buttonType) {
      case 'view_website':
        // Track and redirect to website - show inline since external URL has issues
        await trackAction('website_viewed');
        setShowWebsite(true);
        // Scroll to website section
        setTimeout(() => {
          document.getElementById('website-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'schedule_call':
        // Track and show calendar
        await trackAction('calendar_opened');
        setShowCalendar(true);
        break;
      case 'ask_question':
        // Track and redirect to contact
        await trackAction('chat_opened');
        // Redirect to your phone number for texting
        window.location.href = 'sms:205-500-5170?body=Hi! I have a question about the website you created for us.';
        break;
    }
  };

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

      {/* GoHighLevel Chat Widget - Only load when chat is enabled */}
      {showChat && (
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6861b458393a66019ce23b29"
          strategy="afterInteractive"
        />
      )}

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

            {/* Video Player - Redirects to Repliq */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <a 
                  href={videoData.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer max-w-lg mx-auto hover:opacity-90 transition-opacity block"
                  onClick={() => trackAction('video_clicked')}
                >
                  <div style={{textAlign: 'center'}}>
                    <img 
                      alt="Video Preview" 
                      height="280" 
                      width="500" 
                      style={{
                        maxWidth: '100%',
                        background: "url('https://app.repliq.co/loading/fekozf') no-repeat",
                        display: 'block',
                        backgroundPosition: 'center',
                        borderRadius: '8px',
                        margin: '0 auto'
                      }} 
                      src={videoData.videoPreview} 
                    />
                    <div style={{textAlign: 'center', marginTop: '12px'}}>
                      <span style={{display: 'inline-block', fontWeight: 'bold', fontSize: '16px'}}>
                        ▶️ {videoData.firstName} {videoData.lastName} - Watch Video
                      </span>
                    </div>
                  </div>
                </a>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Personal message from {videoData.firstName} {videoData.lastName}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What would you like to do next?
                </h2>
                <p className="text-gray-600">
                  Choose an option below to continue
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* View Website Button */}
                <button
                  onClick={() => handleActionClick('view_website', 'View My Live Website')}
                  className={`group p-6 rounded-lg border-2 transition-all ${
                    buttonsClicked.includes('view_website')
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🌐</div>
                    <h3 className="font-bold text-gray-900 mb-2">View My Live Website</h3>
                    <p className="text-sm text-gray-600">
                      See your new website in action
                    </p>
                  </div>
                </button>

                {/* Schedule Call Button */}
                <button
                  onClick={() => handleActionClick('schedule_call', '10-minute intro call with me')}
                  className={`group p-6 rounded-lg border-2 transition-all ${
                    buttonsClicked.includes('schedule_call')
                      ? 'border-red-500 bg-red-100' 
                      : 'border-red-200 bg-red-50 hover:border-red-400 hover:bg-red-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">📞</div>
                    <h3 className="font-bold text-gray-900 mb-2">10-minute intro call with me</h3>
                    <p className="text-sm text-gray-600">
                      Let's discuss your website
                    </p>
                  </div>
                </button>

                {/* Ask Question Button */}
                <button
                  onClick={() => handleActionClick('ask_question', 'I have a question')}
                  className={`group p-6 rounded-lg border-2 transition-all ${
                    buttonsClicked.includes('ask_question')
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <h3 className="font-bold text-gray-900 mb-2">I have a question</h3>
                    <p className="text-sm text-gray-600">
                      Chat with me directly
                    </p>
                  </div>
                </button>
              </div>

            </div>

            {/* Calendar Modal */}
            {showCalendar && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                <div className="relative bg-white rounded-lg p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <iframe
                    src="https://api.leadconnectorhq.com/widget/booking/NpJC43C51QzpRohE0k6s"
                    style={{ width: '100%', height: '600px', border: 'none' }}
                    id="booking-calendar"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Website - Only show when requested */}
        {showWebsite && (
          <div id="website-section" className="bg-white border-t-4 border-blue-500">
            <div className="bg-blue-50 py-4">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  🌐 Your Live Website
                </h2>
                <p className="text-blue-700">
                  This is exactly what your customers will see
                </p>
              </div>
            </div>
            <ModernTrustLayout company={company} isVideoIntroMode={true} />
          </div>
        )}
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