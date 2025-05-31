import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '../../lib/db';
import { cacheHelpers } from '../../lib/cache';

// Simple IP-based geolocation fallback
async function getLocationFromIP(req: NextApiRequest) {
  try {
    // Get client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress;
    
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      return null; // Skip localhost
    }

    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
        region: data.regionName,
        country: data.country,
        source: 'ip'
      };
    }
  } catch (error) {
    console.log('IP geolocation failed:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companySlug, templateKey, companyId, sessionId, timeOnPage, userAgent, referrer, isInitial, location } = req.body;
    
    console.log('Tracking request:', { companyId, sessionId, timeOnPage, isInitial });
    
    // Get location data - use GPS if provided, otherwise try IP geolocation
    let locationData = location;
    if (!locationData || (!locationData.latitude || !locationData.longitude)) {
      locationData = await getLocationFromIP(req);
    }
    
    // Get the company by ID to check if it exists
    const company = await queryOne(`
      SELECT id, name FROM companies WHERE id = $1
    `, [companyId]);
    
    if (!company) {
      console.log('Company not found:', companyId);
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Check if tracking is enabled for this company (from main tracking record)
    const trackingRecord = await queryOne(`
      SELECT tracking_enabled, total_views FROM enhanced_tracking 
      WHERE company_id = $1 AND session_id IS NULL
    `, [companyId]);
    
    const trackingEnabled = trackingRecord?.tracking_enabled !== false; // Default to true
    
    if (trackingEnabled && sessionId) {
      // Check if this session already exists
      const existingSession = await queryOne(`
        SELECT id, total_time_seconds, visit_start_time FROM enhanced_tracking 
        WHERE company_id = $1 AND session_id = $2
      `, [companyId, sessionId]);
      
      if (existingSession) {
        // Update existing session with proper end time calculation
        const startTime = new Date(existingSession.visit_start_time);
        const endTime = new Date(startTime.getTime() + (timeOnPage * 1000));
        
        // Update location if provided
        const updateParams: any[] = [companyId, sessionId, timeOnPage || 0, endTime];
        let updateQuery = `
          UPDATE enhanced_tracking 
          SET 
            total_time_seconds = $3,
            visit_end_time = $4,
            last_viewed_at = CURRENT_TIMESTAMP
        `;
        
        if (locationData && locationData.latitude && locationData.longitude) {
          updateQuery += `, latitude = $5, longitude = $6`;
          updateParams.push(locationData.latitude, locationData.longitude);
          
          if (locationData.city) {
            updateQuery += `, city = $7`;
            updateParams.push(locationData.city);
          }
          if (locationData.country) {
            updateQuery += `, country = $${updateParams.length + 1}`;
            updateParams.push(locationData.country);
          }
        }
        
        updateQuery += ` WHERE company_id = $1 AND session_id = $2`;
        
        await query(updateQuery, updateParams);
        
        console.log('Session updated:', { sessionId, timeOnPage, endTime });
      } else {
        // Create new session record
        const startTime = new Date();
        let endTime = null;
        
        // For non-initial requests with time, calculate end time
        if (!isInitial && timeOnPage > 0) {
          endTime = new Date(startTime.getTime() + (timeOnPage * 1000));
        }
        
        // Prepare insert query with optional location
        const insertParams: any[] = [
          companyId, 
          sessionId, 
          templateKey, 
          timeOnPage || 0, 
          userAgent || '', 
          referrer || '',
          startTime,
          endTime
        ];
        
        let insertQuery = `
          INSERT INTO enhanced_tracking (
            company_id, 
            session_id, 
            template_key,
            total_time_seconds,
            user_agent,
            referrer_url,
            visit_start_time,
            visit_end_time,
            last_viewed_at
        `;
        
        let valuesClause = `VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP`;
        
        if (locationData && locationData.latitude && locationData.longitude) {
          insertQuery += `, latitude, longitude`;
          valuesClause += `, $9, $10`;
          insertParams.push(locationData.latitude, locationData.longitude);
          
          if (locationData.city) {
            insertQuery += `, city`;
            valuesClause += `, $${insertParams.length + 1}`;
            insertParams.push(locationData.city);
          }
          if (locationData.country) {
            insertQuery += `, country`;
            valuesClause += `, $${insertParams.length + 1}`;
            insertParams.push(locationData.country);
          }
        }
        
        insertQuery += `) ${valuesClause})`;
        
        await query(insertQuery, insertParams);
        
        // Increment total views in main tracking record (or create it)
        if (isInitial) {
          const mainRecord = await queryOne(`
            SELECT id FROM enhanced_tracking 
            WHERE company_id = $1 AND session_id IS NULL
          `, [companyId]);
          
          if (mainRecord) {
            await query(`
              UPDATE enhanced_tracking 
              SET 
                total_views = COALESCE(total_views, 0) + 1,
                last_viewed_at = CURRENT_TIMESTAMP
              WHERE company_id = $1 AND session_id IS NULL
            `, [companyId]);
          } else {
            await query(`
              INSERT INTO enhanced_tracking (company_id, total_views, tracking_enabled, last_viewed_at)
              VALUES ($1, 1, true, CURRENT_TIMESTAMP)
            `, [companyId]);
          }
        }
        
        // Invalidate business dashboard cache
        cacheHelpers.invalidateCompany(companySlug, companyId);
        
        console.log('New session created:', { 
          companyId, 
          sessionId, 
          timeOnPage, 
          startTime, 
          endTime,
          location: locationData ? `${locationData.latitude}, ${locationData.longitude} (${locationData.city || 'unknown city'}, ${locationData.country || 'unknown country'})` : 'none'
        });
      }
    } else {
      console.log('Tracking disabled or no session ID:', { companySlug, trackingEnabled, sessionId });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking template view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}