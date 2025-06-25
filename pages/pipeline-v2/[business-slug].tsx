import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Pool } from 'pg';
import { createBusinessSlug } from '@/lib/slug-utils';
import { getVideoByName } from '@/lib/repliq-videos';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

interface VideoData {
  videoId: string;
  videoLink: string;
  videoHtmlEmail: string;
  shortVideoHtml: string;
  videoPreview: string;
  firstName: string;
  lastName: string;
}

interface Lead {
  id: number;
  business_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  video_id: string;
  video_link: string;
  campaign_name: string;
}

interface PipelineV2PageProps {
  lead: Lead;
  videoData: VideoData;
  trackingId: string;
}

import { getVideoByCompanySlug } from '@/lib/repliq-videos';

// We'll get video data from the CSV file instead of hardcoded mapping

export default function PipelineV2Page({ lead, videoData, trackingId }: PipelineV2PageProps) {
  const [showButtons, setShowButtons] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);

  useEffect(() => {
    // Track page visit (link clicked)
    trackEvent('link_clicked');

    // Show buttons after 20 seconds
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Track video engagement
    const iframe = document.querySelector('iframe');
    if (iframe) {
      // Simple video watch tracking - in real implementation you'd use Repliq's API
      const watchTimer = setTimeout(() => {
        if (!videoWatched) {
          setVideoWatched(true);
          trackEvent('video_watched');
        }
      }, 30000); // Assume watched after 30 seconds

      return () => clearTimeout(watchTimer);
    }
  }, [videoWatched]);

  const trackEvent = async (eventType: string, data: any = {}) => {
    try {
      await fetch('/api/admin-v2/pipeline/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          event_type: eventType,
          tracking_id: trackingId,
          data
        }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const handleButtonClick = async (buttonType: string, buttonText: string) => {
    if (actionTaken) return;

    setActionTaken(true);
    
    await trackEvent('button_clicked', {
      button_type: buttonType,
      button_text: buttonText
    });

    // Handle different button actions
    switch (buttonType) {
      case 'view_website':
        // Redirect to the actual website
        window.open(`/t/moderntrust/${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, '_blank');
        break;
      case 'schedule_call':
        // Open scheduling link
        window.open('https://calendly.com/your-calendar', '_blank');
        break;
      case 'ask_questions':
        // Open contact form or redirect to questions page
        alert('Thanks for your interest! We\'ll be in touch soon.');
        break;
      case 'not_interested':
        // Track as not interested and show message
        alert('No problem! Thanks for checking it out.');
        break;
    }
  };

  return (
    <>
      <Head>
        <title>Personal Introduction for {lead.business_name}</title>
        <meta name="description" content={`A personal video introduction for ${lead.business_name}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Video Introduction Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hi {lead.business_name}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              I created a website for you and recorded a quick walkthrough
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {lead.city}, {lead.state}
            </p>
          </div>

          {/* Video Player */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center">
              {/* Use the actual Repliq embedded HTML code */}
              <div 
                className="cursor-pointer"
                dangerouslySetInnerHTML={{ 
                  __html: videoData.shortVideoHtml || videoData.videoHtmlEmail || `
                    <a href="${videoData.videoLink}" target="_blank" style="text-decoration:none;">
                      <img src="${videoData.videoPreview}" alt="Video Preview" style="max-width:100%; height:250px;" />
                      <br/>
                      <span style="color:blue; text-decoration:underline;">▶️ ${videoData.firstName} ${videoData.lastName} - Watch Video</span>
                    </a>
                  `
                }}
                onMouseEnter={() => {
                  if (!videoWatched) {
                    setVideoWatched(true);
                    trackEvent('video_engaged');
                  }
                }}
                onClick={() => {
                  if (!videoWatched) {
                    setVideoWatched(true);
                    trackEvent('video_watched');
                  }
                }}
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Personal message from {videoData.firstName} {videoData.lastName}
              </p>
            </div>
          </div>

          {/* Action Buttons - Appear after 20 seconds */}
          <div className={`transition-all duration-1000 ${showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {showButtons && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    What would you like to do next?
                  </h2>
                  <p className="text-gray-600">
                    Choose an option below to continue
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* View Website Button */}
                  <button
                    onClick={() => handleButtonClick('view_website', 'View My Website')}
                    disabled={actionTaken}
                    className={`group p-6 rounded-lg border-2 transition-all ${
                      actionTaken 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌐</div>
                      <h3 className="font-semibold text-gray-900 mb-1">View My Website</h3>
                      <p className="text-sm text-gray-600">
                        See your new website in action
                      </p>
                    </div>
                  </button>

                  {/* Schedule Call Button */}
                  <button
                    onClick={() => handleButtonClick('schedule_call', 'Schedule a Call')}
                    disabled={actionTaken}
                    className={`group p-6 rounded-lg border-2 transition-all ${
                      actionTaken 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">📞</div>
                      <h3 className="font-semibold text-gray-900 mb-1">Schedule a Call</h3>
                      <p className="text-sm text-gray-600">
                        Let's discuss your website
                      </p>
                    </div>
                  </button>

                  {/* Ask Questions Button */}
                  <button
                    onClick={() => handleButtonClick('ask_questions', 'I Have Questions')}
                    disabled={actionTaken}
                    className={`group p-6 rounded-lg border-2 transition-all ${
                      actionTaken 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">❓</div>
                      <h3 className="font-semibold text-gray-900 mb-1">I Have Questions</h3>
                      <p className="text-sm text-gray-600">
                        Get answers about your website
                      </p>
                    </div>
                  </button>

                  {/* Not Interested Button - Discouragingly worded */}
                  <button
                    onClick={() => handleButtonClick('not_interested', 'My Current Website is Perfect')}
                    disabled={actionTaken}
                    className={`group p-6 rounded-lg border-2 transition-all ${
                      actionTaken 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">😐</div>
                      <h3 className="font-semibold text-gray-600 mb-1">My Current Website is Perfect</h3>
                      <p className="text-xs text-gray-500">
                        I don't need more customers
                      </p>
                    </div>
                  </button>
                </div>

                {actionTaken && (
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Thanks for your response! We'll be in touch.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Waiting Message */}
          {!showButtons && (
            <div className="text-center">
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-blue-800 font-medium">
                    Watch the video to see what's next...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  if (!params?.['business-slug']) {
    return { notFound: true };
  }
  
  const businessSlug = params['business-slug'] as string;
  const trackingId = query.ref as string || 'direct';
  
  const client = await pool.connect();
  
  try {
    // Find lead by business name slug (same logic as SMS generation)
    const leadQuery = `
      SELECT 
        l.*,
        c.name as campaign_name
      FROM leads l
      JOIN campaigns c ON l.campaign_id = c.id
      WHERE LOWER(
        TRIM(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(l.business_name, '[^a-zA-Z0-9\\s]', '', 'g'), 
              '\\s+', '-', 'g'
            ), 
            '-+', '-', 'g'
          ), 
          '-'
        )
      ) = $1
      AND l.status = 'active'
    `;
    
    const leadResult = await client.query(leadQuery, [businessSlug.toLowerCase()]);
    
    if (leadResult.rows.length === 0) {
      return { notFound: true };
    }
    
    const lead = leadResult.rows[0];
    
    // Get video data from CSV based on business mapping
    const companyVideoMap: Record<string, { firstName: string; lastName: string }> = {
      'ready-heating-air-llc': { firstName: 'John', lastName: 'Rangan' },
      'calderas-heating-air': { firstName: 'Sarah', lastName: 'Acker' },
      'toms-heating-air-conditioning': { firstName: 'Robert', lastName: 'Suun' },
      'southern-comfort-hvac': { firstName: 'John', lastName: 'Rangan' }, // Use John's video for testing
      'alabama-climate-control': { firstName: 'Sarah', lastName: 'Acker' }, // Use Sarah's video
      'arkansas-air-pros': { firstName: 'Robert', lastName: 'Suun' }, // Use Robert's video
    };
    
    let videoData: VideoData = {
      videoId: 'default',
      videoLink: 'https://app.repliq.co/videos/default',
      videoHtmlEmail: '',
      shortVideoHtml: '',
      videoPreview: '',
      firstName: 'Team',
      lastName: 'Member'
    };
    
    const nameMapping = companyVideoMap[businessSlug];
    console.log('🔍 Business slug:', businessSlug);
    console.log('🔍 Name mapping:', nameMapping);
    
    if (nameMapping) {
      try {
        const csvVideoData = getVideoByName(nameMapping.firstName, nameMapping.lastName);
        
        console.log('🔍 CSV video data:', csvVideoData);
        
        if (csvVideoData) {
          videoData = {
            videoId: csvVideoData.id,
            videoLink: csvVideoData.videoLink,
            videoHtmlEmail: csvVideoData.videoHtmlEmail,
            shortVideoHtml: csvVideoData.shortVideoHtml,
            videoPreview: csvVideoData.videoPreview,
            firstName: csvVideoData.firstName,
            lastName: csvVideoData.lastName
          };
          console.log('✅ Video data loaded successfully');
        } else {
          console.log('❌ No CSV video data found');
        }
      } catch (error) {
        console.error('❌ Error loading video data from CSV:', error);
      }
    } else {
      console.log('❌ No name mapping found for business slug:', businessSlug);
    }
    
    // Track the page visit
    if (trackingId !== 'direct') {
      try {
        await client.query(`
          INSERT INTO lead_activities (
            lead_id,
            activity_type,
            description,
            performed_by,
            data
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          lead.id,
          'link_clicked',
          `Landing page visited for ${lead.business_name}`,
          'system',
          JSON.stringify({
            tracking_id: trackingId,
            timestamp: new Date().toISOString(),
            referrer: 'sms_campaign'
          })
        ]);
      } catch (trackingError) {
        console.error('Error tracking page visit:', trackingError);
      }
    }
    
    return {
      props: {
        lead: JSON.parse(JSON.stringify(lead)),
        videoData,
        trackingId,
      },
    };
  } catch (error) {
    console.error('Error loading pipeline v2 page:', error);
    return { notFound: true };
  } finally {
    client.release();
  }
};