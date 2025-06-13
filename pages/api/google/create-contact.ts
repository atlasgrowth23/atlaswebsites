import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession, getValidGoogleToken } from '@/lib/auth-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get admin session from cookie
    const sessionToken = req.cookies.admin_session;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await getAdminSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { ownerName, ownerEmail, companyName, phone, notes } = req.body;
    
    if (!ownerName || !ownerEmail) {
      return res.status(400).json({ error: 'Owner name and email are required' });
    }
    
    // Get valid access token
    const accessToken = await getValidGoogleToken(session);
    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to get valid Google token' });
    }
    
    // Create contact data
    const contactData = {
      names: [{ 
        givenName: ownerName.split(' ')[0] || ownerName,
        familyName: ownerName.split(' ').slice(1).join(' ') || '',
        displayName: ownerName
      }],
      emailAddresses: [{ 
        value: ownerEmail,
        type: 'work'
      }],
      phoneNumbers: phone ? [{ 
        value: phone,
        type: 'work'
      }] : [],
      organizations: companyName ? [{ 
        name: companyName,
        type: 'work'
      }] : [],
      biographies: notes ? [{ 
        value: `Pipeline Lead: ${notes}`,
        contentType: 'TEXT_PLAIN'
      }] : []
    };
    
    // Create contact in Google
    const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google API error:', errorData);
      throw new Error(`Google API error: ${response.status}`);
    }
    
    const createdContact = await response.json();
    
    console.log(`✅ Contact created by ${session.email}: ${ownerName} (${ownerEmail})`);
    
    res.status(200).json({ 
      success: true, 
      contactId: createdContact.resourceName,
      message: 'Contact created successfully in Google Contacts'
    });
    
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create contact'
    });
  }
}