import { supabaseAdmin } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  states: string[];
  name: string;
}

// Simple user management - later we can move this to database
const USERS: Record<string, Omit<User, 'id'>> = {
  // We'll add your email and Jared's email here once you provide them
};

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    // Use Supabase auth
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return null;
    }

    // Get user profile from our user mapping
    const userProfile = USERS[email];
    if (!userProfile) {
      return null;
    }

    return {
      id: data.user.id,
      ...userProfile,
      email: data.user.email!
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function createUser(email: string, password: string, role: 'admin' | 'viewer', states: string[], name: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    // Add to our user mapping
    USERS[email] = { email, role, states, name };
    
    return data.user;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

export function getUserStates(user: User): string[] {
  return user.states;
}

export function canAccessState(user: User, state: string): boolean {
  return user.states.includes(state);
}