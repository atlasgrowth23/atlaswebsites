/**
 * Reprocess all logos with improved sizing and quality
 */
const { query } = require('../lib/db');
const { processLogo } = require('../lib/processLogo');

async function reprocessAllLogos() {
  console.log('Starting logo reprocessing with improved sizing...');
  
  try {
    // Get all companies with logos
    const result = await query(`
      SELECT id, slug, logo, name 
      FROM companies 
      WHERE logo IS NOT NULL AND logo != ''
      ORDER BY name
    `);
    
    const companies = result.rows;
    console.log(`Found ${companies.length} companies with logos to reprocess`);
    
    let processed = 0;
    let errors = 0;
    
    for (const company of companies) {
      try {
        console.log(`Processing logo for ${company.name} (${company.slug})...`);
        
        // Clean and reprocess the logo with improved sizing
        const processedUrl = await processLogo(company.slug, company.logo);
        
        if (processedUrl) {
          processed++;
          console.log(`✅ Successfully processed logo for ${company.name}`);
        } else {
          console.log(`⚠️ Logo processing returned null for ${company.name}`);
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing logo for ${company.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Logo reprocessing complete:`);
    console.log(`✅ Successfully processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📁 Total companies: ${companies.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error reprocessing logos:', error);
    process.exit(1);
  }
}

reprocessAllLogos();