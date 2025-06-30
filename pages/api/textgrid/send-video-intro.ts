import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
// import { getVideoByCompanySlug, generateSmsMessage, getMmsImageUrl } from '@/lib/repliq-videos';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, phoneNumber, testMode = true } = req.body;

    if (!companySlug || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields: companySlug, phoneNumber' });
    }

    // Get company data
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('slug', companySlug)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get video data for this company (hardcoded for testing)
    const videoMapping: Record<string, any> = {
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
        firstName: 'Jared',
        lastName: 'Thompson'
      },
      'airpro': {
        videoId: 'n799e78ebw1',
        videoLink: 'https://app.repliq.co/videos/n799e78ebw1',
        videoPreview: 'https://app.repliq.co/medias/n799e78ebw1',
        firstName: 'Jared',
        lastName: 'Thompson'
      },
      'hook-mechanical-llc': {
        videoId: 'n71ea2cc4w1',
        videoLink: 'https://app.repliq.co/videos/n71ea2cc4w1', 
        videoPreview: 'https://app.repliq.co/medias/n71ea2cc4w1',
        firstName: 'Jared',
        lastName: 'Thompson'
      }
    };

    const videoData = videoMapping[companySlug];
    if (!videoData) {
      return res.status(404).json({ error: 'No video data found for company' });
    }

    // Generate video intro URL
    const baseUrl = 'https://ecff9f9a-4730-4865-9bc1-4171f6a31017-00-27datk18aao4y.picard.replit.dev';
    const videoIntroUrl = `${baseUrl}/video-intro/${companySlug}`;

    // Generate personalized message
    const message = `Hi ${company.name}! I'm ${videoData.firstName} and I created a website for you. I recorded a quick walkthrough - check it out: ${videoIntroUrl}`;

    // Get MMS image URL
    const imageUrl = videoData.videoPreview;

    // Prepare TextGrid API payload
    const textGridPayload = {
      To: phoneNumber,
      From: process.env.TEXTGRID_FROM_NUMBER,
      Body: message,
      MediaUrl: imageUrl, // MMS image
    };

    if (testMode) {
      // In test mode, just return what would be sent
      return res.status(200).json({
        success: true,
        testMode: true,
        payload: textGridPayload,
        videoIntroUrl,
        message: 'Test mode - message not actually sent',
        videoData: {
          firstName: videoData.firstName,
          lastName: videoData.lastName,
          videoId: videoData.videoLink.split('/').pop(),
        }
      });
    }

    // Make actual TextGrid API call
    const auth = Buffer.from(`${process.env.TEXTGRID_ACCOUNT_SID}:${process.env.TEXTGRID_AUTH_TOKEN}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('To', textGridPayload.To);
    formData.append('From', textGridPayload.From);
    formData.append('Body', textGridPayload.Body);
    // Skip MediaUrl since this number doesn't support MMS
    // formData.append('MediaUrl', textGridPayload.MediaUrl);

    const textGridResponse = await fetch(`https://api.textgrid.com/v1/accounts/${process.env.TEXTGRID_ACCOUNT_SID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    const textGridResult = await textGridResponse.text();
    console.log('TextGrid response status:', textGridResponse.status);
    console.log('TextGrid response:', textGridResult);
    
    if (!textGridResponse.ok) {
      console.error('TextGrid API error:', textGridResult);
      return res.status(500).json({ error: 'Failed to send SMS', details: textGridResult });
    }

    // Log the activity
    await supabaseAdmin
      .from('hvac_activities')
      .insert({
        company_id: company.id,
        activity_type: 'video_intro_sent',
        description: `Video intro SMS sent to ${phoneNumber}`,
        metadata: {
          phone: phoneNumber,
          videoId: videoData.videoLink.split('/').pop(),
          videoIntroUrl,
          firstName: videoData.firstName,
          lastName: videoData.lastName,
        },
      });

    return res.status(200).json({
      success: true,
      textGridResponse: textGridResult,
      videoIntroUrl,
      videoData: {
        firstName: videoData.firstName,
        lastName: videoData.lastName,
        videoId: videoData.videoLink.split('/').pop(),
      }
    });

  } catch (error) {
    console.error('Error sending video intro SMS:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}