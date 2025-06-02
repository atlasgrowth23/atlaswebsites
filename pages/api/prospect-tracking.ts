import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface ProspectData {
  companyId: string;
  sessionId: string;
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
  formType: 'contact' | 'quote' | 'chat' | 'call' | 'email';
  sourcePage: string;
  userAgent: string;
  referrer?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      companyId,
      sessionId,
      email,
      phone,
      name,
      message,
      formType,
      sourcePage,
      userAgent,
      referrer
    }: ProspectData = req.body;

    // Validate required fields
    if (!companyId || !sessionId || !formType || !sourcePage) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companyId', 'sessionId', 'formType', 'sourcePage']
      });
    }

    // At least one contact method should be provided
    if (!email && !phone && !name) {
      return res.status(400).json({ 
        error: 'At least one contact method (email, phone, or name) is required'
      });
    }

    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || 'unknown';

    const prospectData = {
      company_id: companyId,
      session_id: sessionId,
      email: email || null,
      phone: phone || null,
      name: name || null,
      message: message || null,
      form_type: formType,
      source_page: sourcePage,
      referrer_url: referrer || null,
      user_agent: userAgent,
      ip_address: ip !== 'unknown' ? ip : null,
      created_at: new Date().toISOString()
    };

    // Insert prospect data
    const { data, error } = await supabaseAdmin
      .from('prospect_tracking')
      .insert([prospectData])
      .select()
      .single();

    if (error) throw error;

    // Log for debugging
    console.log('New prospect tracked:', {
      companyId,
      formType,
      hasEmail: !!email,
      hasPhone: !!phone,
      hasName: !!name
    });

    return res.status(200).json({
      success: true,
      prospectId: data.id,
      message: 'Prospect tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking prospect:', error);
    return res.status(500).json({
      error: 'Failed to track prospect',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}