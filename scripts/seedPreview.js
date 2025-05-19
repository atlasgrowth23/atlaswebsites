// scripts/seedPreview.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to execute queries
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Functions for accessing the portal database
const portalDb = {
  async getCompany(slug) {
    const result = await query('SELECT * FROM companies WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },
  
  async getPreviewUser(slug) {
    const result = await query('SELECT username, password_hash, expires_at FROM preview_users WHERE company_slug = $1', [slug]);
    return result.rows[0] || null;
  },
  
  async setPreviewUser(slug, userData) {
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

async function seedPreviewUsers() {
  try {
    // Get companies directly from the database
    console.log("Getting companies from database...");
    const result = await query('SELECT * FROM companies WHERE slug IS NOT NULL');
    const companies = result.rows;
    console.log(`Found ${companies.length} companies with slugs.`);
    
    if (companies.length === 0) {
      console.log("No companies found with slugs. Please check your database.");
      process.exit(1);
    }
    
    const lines = ["slug,username,password"];
    for (const c of companies) {
      const username = `${c.slug}-preview`;
      const password = crypto.randomUUID().slice(0, 8); // 8-char throw-away
      const passwordHash = await bcrypt.hash(password, 10);

      await portalDb.setPreviewUser(c.slug, {
        username,
        passwordHash,
        expires: Date.now() + 14 * 24 * 3600 * 1000 // 14 days
      });

      lines.push(`${c.slug},${username},${password}`);
    }
    fs.writeFileSync("./preview_creds.csv", lines.join("\n"));
    console.log("✅ seeded preview users -> preview_creds.csv");
    
  } catch (error) {
    console.error("Error seeding preview users:", error);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedPreviewUsers();