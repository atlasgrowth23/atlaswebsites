const { Client } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

async function rebuildDatabase() {
  const connectionString = 'postgresql://postgres.zjxvacezqbhyomrngynq:Matheos23$Who@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // 1. CLEAN SLATE - Drop and recreate companies table
    console.log('🗑️ Dropping existing companies table...');
    await client.query('DROP TABLE IF EXISTS companies CASCADE');
    
    // 2. CREATE NEW COMPANIES TABLE (no logo column for non-logo businesses)
    console.log('🏗️ Creating new companies table...');
    await client.query(`
      CREATE TABLE companies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        city TEXT,
        state TEXT,
        phone TEXT,
        rating DECIMAL,
        reviews INTEGER,
        place_id TEXT,
        reviews_link TEXT,
        predicted_label TEXT,
        r_30 INTEGER DEFAULT 0,
        r_60 INTEGER DEFAULT 0,
        r_90 INTEGER DEFAULT 0,
        r_365 INTEGER DEFAULT 0,
        first_review_date TEXT,
        parsed_working_hours JSONB,
        email_1 TEXT,
        site TEXT,
        latitude DECIMAL,
        longitude DECIMAL,
        logo_storage_path TEXT, -- Only for businesses with predicted_label = 'logo'
        modern_trust_preview TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. CLEAN AND IMPORT CSV DATA
    console.log('📥 Reading and importing CSV data...');
    
    const companies = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream('combined_alabama_arkansas_fixed_r365.csv')
        .pipe(csv())
        .on('data', (row) => {
          // Skip if no name or slug
          if (!row.name || !row.slug) return;
          
          // Clean the data
          companies.push({
            name: row.name,
            slug: row.slug,
            city: row.city,
            state: row.state,
            phone: row.phone,
            rating: row.rating ? parseFloat(row.rating) : null,
            reviews: row.reviews ? parseInt(row.reviews) : null,
            place_id: row.place_id,
            reviews_link: row.reviews_link,
            predicted_label: row.predicted_label,
            r_30: parseInt(row.r_30) || 0,
            r_60: parseInt(row.r_60) || 0,
            r_90: parseInt(row.r_90) || 0,
            r_365: parseInt(row.r_365) || 0,
            first_review_date: row.first_review_date,
            parsed_working_hours: row.parsed_working_hours ? JSON.parse(row.parsed_working_hours) : null,
            email_1: row.email_1,
            site: row.site,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            logo_storage_path: row.predicted_label === 'logo' ? `/logos/${row.slug}.png` : null,
            // Fix the URL: atlasthrust → atlasgrowth, modern-trust → moderntrust
            modern_trust_preview: row.modern_trust_preview 
              ? row.modern_trust_preview.replace('atlasthrust.ai', 'atlasgrowth.ai').replace('modern-trust', 'moderntrust')
              : `https://atlasgrowth.ai/t/moderntrust/${row.slug}`
          });
        })
        .on('end', async () => {
          try {
            console.log(`📊 Parsed ${companies.length} companies from CSV`);
            
            // Batch insert companies
            for (let i = 0; i < companies.length; i += 50) {
              const batch = companies.slice(i, i + 50);
              const placeholders = batch.map((_, idx) => 
                `($${idx * 20 + 1}, $${idx * 20 + 2}, $${idx * 20 + 3}, $${idx * 20 + 4}, $${idx * 20 + 5}, $${idx * 20 + 6}, $${idx * 20 + 7}, $${idx * 20 + 8}, $${idx * 20 + 9}, $${idx * 20 + 10}, $${idx * 20 + 11}, $${idx * 20 + 12}, $${idx * 20 + 13}, $${idx * 20 + 14}, $${idx * 20 + 15}, $${idx * 20 + 16}, $${idx * 20 + 17}, $${idx * 20 + 18}, $${idx * 20 + 19}, $${idx * 20 + 20})`
              ).join(',');
              
              const values = batch.flatMap(company => [
                company.name, company.slug, company.city, company.state, company.phone,
                company.rating, company.reviews, company.place_id, company.reviews_link,
                company.predicted_label, company.r_30, company.r_60, company.r_90, company.r_365,
                company.first_review_date, company.parsed_working_hours, company.email_1,
                company.site, company.latitude, company.longitude
              ]);

              await client.query(`
                INSERT INTO companies (name, slug, city, state, phone, rating, reviews, place_id, reviews_link, predicted_label, r_30, r_60, r_90, r_365, first_review_date, parsed_working_hours, email_1, site, latitude, longitude)
                VALUES ${placeholders}
              `, values);
              
              console.log(`✅ Inserted batch ${Math.floor(i/50) + 1}/${Math.ceil(companies.length/50)}`);
            }

            // 4. POPULATE FRAMES TABLE WITH STORAGE PATHS
            console.log('🖼️ Setting up template frames with storage paths...');
            await client.query('DELETE FROM frames'); // Clear existing
            
            await client.query(`
              INSERT INTO frames (slug, template_key, default_url, description) VALUES
              ('hero_img', 'moderntrust', '/storage/templates/moderntrust/hero.jpg', 'ModernTrust hero image'),
              ('about_img', 'moderntrust', '/storage/templates/moderntrust/about.jpg', 'ModernTrust about image'),
              ('logo_url', 'moderntrust', '/storage/templates/moderntrust/default-logo.svg', 'ModernTrust default logo')
            `);

            const logoCompanies = companies.filter(c => c.predicted_label === 'logo').length;
            const textCompanies = companies.filter(c => c.predicted_label === 'not_logo').length;
            
            console.log('🎉 DATABASE REBUILD COMPLETE!');
            console.log(`📊 Imported ${companies.length} companies:`);
            console.log(`   - ${logoCompanies} with logos`);
            console.log(`   - ${textCompanies} text-only (no logo)`);
            console.log('🖼️ Template frames ready for Supabase Storage');
            
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

rebuildDatabase();