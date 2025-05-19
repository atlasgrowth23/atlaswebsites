// lib/portalDb.ts
import { Pool } from 'pg';
import { db, query, queryOne } from './db';
import bcrypt from "bcryptjs";

// Functions for working with the portal authentication system using PostgreSQL
export const portalDb = {
  async getCompany(slug: string): Promise<any | null> {
    // Get a company by slug from the companies table
    return queryOne('SELECT * FROM companies WHERE slug = $1', [slug]);
  },
  
  async getPreviewUser(slug: string): Promise<any | null> {
    // Get a preview user from the preview_users table
    return queryOne('SELECT * FROM preview_users WHERE company_slug = $1', [slug]);
  },
  
  async verifyCredentials(slug: string, password: string): Promise<boolean> {
    const user = await this.getPreviewUser(slug);
    if (!user) return false;
    
    try {
      // For debug purposes, log useful information
      console.log(`Verifying credentials for ${slug}, password provided: ${password ? 'yes' : 'no'}`);
      
      // Compare the provided password with the hashed one in the database
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`Password validation result: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return false;
    }
  },
  
  async setPreviewUser(slug: string, userData: { username: string, passwordHash: string, expires: number }): Promise<void> {
    // Check if user exists
    const existingUser = await this.getPreviewUser(slug);
    
    if (existingUser) {
      // Update existing user
      await query(
        'UPDATE preview_users SET username = $1, password_hash = $2, expires_at = $3 WHERE company_slug = $4',
        [userData.username, userData.passwordHash, new Date(userData.expires), slug]
      );
    } else {
      // Insert new user
      await query(
        'INSERT INTO preview_users (company_slug, username, password_hash, expires_at) VALUES ($1, $2, $3, $4)',
        [slug, userData.username, userData.passwordHash, new Date(userData.expires)]
      );
    }
  }
};