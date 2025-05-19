// lib/directAuth.ts
import { query, queryOne } from './db';

// Simple authentication system for preview users
export const directAuth = {
  // Check if a company exists by slug
  async companyExists(slug: string): Promise<boolean> {
    const company = await queryOne('SELECT id FROM companies WHERE slug = $1', [slug]);
    return !!company;
  },
  
  // Track portal view for analytics
  async trackPortalView(slug: string, userAgent?: string, ip?: string): Promise<void> {
    try {
      // Check if we have a portal_views table
      const tableExists = await queryOne(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portal_views')"
      );
      
      if (!tableExists?.exists) {
        // Create table if it doesn't exist
        await query(`
          CREATE TABLE IF NOT EXISTS portal_views (
            id SERIAL PRIMARY KEY,
            company_slug VARCHAR(255) NOT NULL,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            ip_address VARCHAR(45),
            CONSTRAINT fk_company
              FOREIGN KEY(company_slug) 
              REFERENCES companies(slug)
              ON DELETE CASCADE
          )
        `);
      }
      
      // Record the view
      await query(
        'INSERT INTO portal_views (company_slug, user_agent, ip_address) VALUES ($1, $2, $3)',
        [slug, userAgent || 'Unknown', ip || 'Unknown']
      );
      
      console.log(`Tracked portal view for ${slug}`);
    } catch (error) {
      console.error('Error tracking portal view:', error);
    }
  },
  
  // Get company data by slug
  async getCompanyData(slug: string): Promise<any> {
    return queryOne('SELECT * FROM companies WHERE slug = $1', [slug]);
  }
};