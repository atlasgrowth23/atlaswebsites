import { NextApiRequest, NextApiResponse } from 'next';
import { getAdminSession, getValidGoogleToken } from '@/lib/auth-google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.admin_session;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await getAdminSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const accessToken = await getValidGoogleToken(session);
    if (!accessToken) {
      return res.status(401).json({ error: 'Google access token invalid' });
    }

    const { search } = req.query;

    // Fetch contacts from Google People API
    let url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers&pageSize=100';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Contacts API error:', response.status, errorData);
      return res.status(500).json({ error: 'Failed to fetch contacts from Google' });
    }

    const data = await response.json();
    
    // Transform contacts for easier use
    const contacts = (data.connections || []).map((contact: any) => {
      const name = contact.names?.[0];
      const email = contact.emailAddresses?.[0];
      const organization = contact.organizations?.[0];
      const phone = contact.phoneNumbers?.[0];

      if (!name || !email) return null;

      const displayName = name.displayName || `${name.givenName || ''} ${name.familyName || ''}`.trim();
      const companyName = organization?.name || '';
      
      return {
        id: contact.resourceName,
        name: displayName,
        email: email.value,
        company: companyName,
        phone: phone?.value || '',
        searchText: `${displayName} ${companyName} ${email.value}`.toLowerCase()
      };
    }).filter(Boolean);

    // Filter by search term if provided
    let filteredContacts = contacts;
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      filteredContacts = contacts.filter((contact: any) => 
        contact.searchText.includes(searchTerm)
      );
    }

    // Sort by name
    filteredContacts.sort((a: any, b: any) => a.name.localeCompare(b.name));

    res.status(200).json({
      contacts: filteredContacts.slice(0, 50), // Limit to 50 results
      total: filteredContacts.length
    });

  } catch (error) {
    console.error('Error fetching Google contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}