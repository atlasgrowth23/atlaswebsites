import { supabase, supabaseAdmin } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // First check session storage for admin user
    if (typeof window !== 'undefined') {
      const adminData = sessionStorage.getItem('atlas_admin');
      if (adminData) {
        const admin = JSON.parse(adminData);
        // Check if session is still valid (24 hours)
        if (admin.login_time && (Date.now() - admin.login_time) < (24 * 60 * 60 * 1000)) {
          return {
            id: admin.email, // Use email as ID for admin users
            email: admin.email,
            role: admin.role as 'admin' | 'super_admin',
            name: admin.name
          };
        } else {
          // Session expired, clear it
          sessionStorage.removeItem('atlas_admin');
        }
      }
    }

    // Fallback to Supabase auth
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }

    // Get role from JWT claims or user metadata
    const role = data.user.user_metadata?.role || data.user.role || 'admin';
    
    return {
      id: data.user.id,
      email: data.user.email!,
      role: role as 'admin' | 'super_admin',
      name: data.user.user_metadata?.name || data.user.email
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send', 
          'https://www.googleapis.com/auth/gmail.compose',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/admin.directory.user.readonly'
        ].join(' ')
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export async function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin';
}