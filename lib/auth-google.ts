import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin email configuration with roles
const ADMIN_EMAILS = {
  'nicholas@atlasgrowth.ai': 'super_admin',
  'jared@atlasgrowth.ai': 'admin'
} as const;

export type AdminRole = 'super_admin' | 'admin';

export interface AdminSession {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  google_access_token: string;
  google_refresh_token: string;
  google_token_expires_at: string;
  google_scopes: string[];
  session_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export function isAdminEmail(email: string): boolean {
  return email in ADMIN_EMAILS;
}

export function getAdminRole(email: string): AdminRole | null {
  return ADMIN_EMAILS[email as keyof typeof ADMIN_EMAILS] || null;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createAdminSession(
  email: string,
  name: string | null,
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  }
): Promise<string> {
  const role = getAdminRole(email);
  if (!role) {
    throw new Error('Email not authorized for admin access');
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const googleExpiresAt = new Date(Date.now() + googleTokens.expires_in * 1000);
  const scopes = googleTokens.scope.split(' ');

  const sessionData = {
    email,
    name,
    role,
    google_access_token: googleTokens.access_token,
    google_refresh_token: googleTokens.refresh_token,
    google_token_expires_at: googleExpiresAt.toISOString(),
    google_scopes: scopes,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString()
  };

  console.log(`💾 Creating session for ${email} with token: ${sessionToken.substring(0, 10)}...`);

  const { error } = await supabase
    .from('admin_sessions')
    .insert(sessionData);

  if (error) {
    console.error('❌ Failed to create admin session:', error);
    throw new Error('Failed to create session');
  }

  console.log(`✅ Session created successfully for ${email}`);
  return sessionToken;
}

export async function getAdminSession(sessionToken: string): Promise<AdminSession | null> {
  console.log(`🔍 Looking up session: ${sessionToken.substring(0, 10)}...`);
  
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    console.log(`❌ Session lookup error:`, error);
    return null;
  }

  if (!data) {
    console.log(`❌ No session found for token: ${sessionToken.substring(0, 10)}...`);
    return null;
  }

  console.log(`✅ Found valid session for ${data.email}`);
  return data as AdminSession;
}

export async function refreshGoogleToken(session: AdminSession): Promise<AdminSession | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: session.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokens = await response.json();
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { data, error } = await supabase
      .from('admin_sessions')
      .update({
        google_access_token: tokens.access_token,
        google_token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_token', session.session_token)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error('Failed to update session');
    }

    return data as AdminSession;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

export async function getValidGoogleToken(session: AdminSession): Promise<string | null> {
  const now = new Date();
  const expiresAt = new Date(session.google_token_expires_at);

  if (now >= expiresAt) {
    // Token expired, refresh it
    const refreshedSession = await refreshGoogleToken(session);
    return refreshedSession?.google_access_token || null;
  }

  return session.google_access_token;
}

export async function deleteAdminSession(sessionToken: string): Promise<void> {
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('session_token', sessionToken);
}

export async function cleanupExpiredSessions(): Promise<void> {
  await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}