import { google } from 'googleapis';
import { supabaseAdmin } from './supabase';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string | null;
}

async function getStoredTokens(userId: string): Promise<TokenData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_user_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error || !data) {
      console.error('No Google tokens found for user:', userId);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return null;
  }
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token in refresh response');
    }

    // Update stored tokens
    const expiresAt = credentials.expiry_date 
      ? new Date(credentials.expiry_date).toISOString() 
      : null;

    await supabaseAdmin
      .from('admin_user_tokens')
      .update({
        access_token: credentials.access_token,
        expires_at: expiresAt
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function refreshIfExpired(userId: string, tokens: TokenData): Promise<string | null> {
  // Check if token is expired (with 5 minute buffer)
  if (tokens.expires_at) {
    const expiryTime = new Date(tokens.expires_at).getTime();
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now >= (expiryTime - bufferTime)) {
      console.log('Token expired, refreshing...');
      return await refreshAccessToken(userId, tokens.refresh_token);
    }
  }

  return tokens.access_token;
}

export async function getGmailClient(userId: string) {
  try {
    const tokens = await getStoredTokens(userId);
    if (!tokens) {
      throw new Error('No Google tokens found');
    }

    const accessToken = await refreshIfExpired(userId, tokens);
    if (!accessToken) {
      throw new Error('Failed to get valid access token');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: tokens.refresh_token
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error('Error creating Gmail client:', error);
    throw error;
  }
}

export async function getCalendarClient(userId: string) {
  try {
    const tokens = await getStoredTokens(userId);
    if (!tokens) {
      throw new Error('No Google tokens found');
    }

    const accessToken = await refreshIfExpired(userId, tokens);
    if (!accessToken) {
      throw new Error('Failed to get valid access token');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: tokens.refresh_token
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error creating Calendar client:', error);
    throw error;
  }
}

export { refreshIfExpired };