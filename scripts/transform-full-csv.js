const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a slug from a company name
 * @param {string} name - The company name
 * @returns {string} A URL-friendly slug
 */
function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Transform the large CSV file to match the format of the smaller one
 */
async function transformFullCsv() {
  console.log('Starting CSV transformation...');
  
  // Read the source CSV file
  const sourcePath = path.join(process.cwd(), 'bamahvac - Copy of Copy of Outscraper-20250408050616m08_hvac_contractor.csv');
  const targetPath = path.join(process.cwd(), 'all_companies_transformed.csv');
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source CSV file not found at ${sourcePath}`);
    return;
  }
  
  console.log(`Reading source CSV file: ${sourcePath}`);
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  
  // Parse CSV data
  const sourceRecords = parse(sourceContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${sourceRecords.length} companies in source CSV file`);
  
  // Read the target schema from the smaller CSV
  const schemaPath = path.join(process.cwd(), 'companies_rows (1).csv');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schemaHeader = schemaContent.split('\n')[0];
  const targetColumns = schemaHeader.split(',');
  
  console.log(`Target schema has ${targetColumns.length} columns`);
  
  // Transform the records
  const transformedRecords = [];
  const now = new Date().toISOString();
  
  for (let i = 0; i < sourceRecords.length; i++) {
    const source = sourceRecords[i];
    
    // Filter based on phone carrier type if present
    const carrierType = source['phone.phones_enricher.carrier_type'];
    if (carrierType && !['mobile', 'voip', 'fixed line'].includes(carrierType)) {
      continue;
    }
    
    // Create a new record with the target schema
    const transformed = {
      id: uuidv4(), // Generate unique ID
      slug: generateSlug(source.name),
      subdomain: '',
      custom_domain: '',
      name: source.name || '',
      site: source.site || '',
      phone: source.phone || '',
      phone_carrier_type: source['phone.phones_enricher.carrier_type'] || '',
      category: source.category || source.type || 'hvac contractor',
      street: source.street || '',
      city: source.city || '',
      postal_code: source.postal_code || '',
      state: source.state || '',
      latitude: source.latitude || null,
      longitude: source.longitude || null,
      rating: source.rating || null,
      reviews: source.reviews || 0,
      photos_count: source.photos_count || 0,
      working_hours: source.working_hours || null,
      about: source.about || null,
      logo: source.logo || null,
      verified: source.verified === 'TRUE' ? 'true' : 'false',
      place_id: source.place_id || null,
      location_link: source.location_link || null,
      location_reviews_link: source.location_reviews_link || null,
      email_1: source.email_1 || null,
      email_1_validator_status: source['email_1.emails_validator.status'] || null,
      email_1_full_name: source.email_1_full_name || null,
      facebook: source.facebook || null,
      instagram: source.instagram || null,
      // Store the extras as a JSON string
      extras: JSON.stringify({
        h3: source.h3,
        cid: source.cid,
        kgmid: source.kgmid,
        type: source.type,
        about: source.about,
        query: source.query,
        phone_1: source.phone_1,
        phone_2: source.phone_2,
        phone_3: source.phone_3,
        twitter: source.twitter,
        youtube: source.youtube,
        owner_id: source.owner_id,
        subtypes: source.subtypes,
        google_id: source.google_id,
        time_zone: source.time_zone,
        website_title: source.website_title,
        website_description: source.website_description,
        site_company_insights_name: source['site.company_insights.name'],
        site_company_insights_phone: source['site.company_insights.phone'],
        phone_whitepages_phones_name: source['phone.whitepages_phones.name'],
        site_company_insights_country: source['site.company_insights.country'],
        phone_phones_enricher_carrier_name: source['phone.phones_enricher.carrier_name'],
        phone_phones_enricher_carrier_type: source['phone.phones_enricher.carrier_type'],
        site_company_insights_founded_year: source['site.company_insights.founded_year']
      }),
      created_at: now,
      updated_at: now
    };
    
    transformedRecords.push(transformed);
    
    if (i % 100 === 0 && i > 0) {
      console.log(`Transformed ${i} records so far...`);
    }
  }
  
  console.log(`Transformation complete. Generated ${transformedRecords.length} records.`);
  
  // Write the transformed records to a new CSV file
  const csvOutput = stringify(transformedRecords, { 
    header: true,
    columns: targetColumns 
  });
  
  fs.writeFileSync(targetPath, csvOutput);
  console.log(`Transformed CSV written to: ${targetPath}`);
}

// Run the transformation
transformFullCsv().catch(err => {
  console.error('Error during transformation:', err);
});