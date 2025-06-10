import { supabase, supabaseAdmin } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
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
        redirectTo: `${window.location.origin}/admin/messages`,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar'
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