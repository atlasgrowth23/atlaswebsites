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
    return queryOne('SELECT username, password_hash, expires_at FROM preview_users WHERE company_slug = $1', [slug]);
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