import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Checking database structure...');

    // Check companies table
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(3);

    // Check template_views table  
    const { data: templateViews, error: templateViewsError } = await supabaseAdmin
      .from('template_views')
      .select('*')
      .limit(3);

    // Check if daily_analytics exists
    const { data: dailyAnalytics, error: dailyError } = await supabaseAdmin
      .from('daily_analytics')
      .select('*')
      .limit(3);

    const result = {
      companies: {
        exists: !companiesError,
        error: companiesError?.message,
        count: companies?.length || 0,
        sample: companies?.[0] ? Object.keys(companies[0]) : [],
        data: companies
      },
      template_views: {
        exists: !templateViewsError,
        error: templateViewsError?.message,
        count: templateViews?.length || 0,
        sample: templateViews?.[0] ? Object.keys(templateViews[0]) : [],
        data: templateViews
      },
      daily_analytics: {
        exists: !dailyError,
        error: dailyError?.message,
        count: dailyAnalytics?.length || 0,
        sample: dailyAnalytics?.[0] ? Object.keys(dailyAnalytics[0]) : [],
        data: dailyAnalytics
      }
    };

    console.log('📊 Database structure check result:', result);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('Database check error:', error);
    return res.status(500).json({ 
      error: 'Database check failed',
      details: (error as Error).message 
    });
  }
}