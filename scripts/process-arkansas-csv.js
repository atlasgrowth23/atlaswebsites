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
 * Process the Arkansas CSV file and combine with Alabama data
 */
async function processArkansasCsv() {
  console.log('Starting Arkansas CSV transformation with filters...');
  
  // Read the source CSV file
  const sourcePath = path.join(process.cwd(), 'Untitled spreadsheet - Outscraper-20250408050716s6d_hvac_contractor (3) (1).csv');
  const targetPath = path.join(process.cwd(), 'arkansas_filtered.csv');
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source CSV file not found at ${sourcePath}`);
    return;
  }
  
  console.log(`Reading Arkansas CSV file: ${sourcePath}`);
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  
  // Parse CSV data
  const sourceRecords = parse(sourceContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${sourceRecords.length} companies in Arkansas CSV file`);
  
  // Read the target schema from the smaller CSV
  const schemaPath = path.join(process.cwd(), 'companies_rows (1).csv');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const schemaHeader = schemaContent.split('\n')[0];
  const targetColumns = schemaHeader.split(',');
  
  console.log(`Target schema has ${targetColumns.length} columns`);
  
  // Transform the records
  const transformedRecords = [];
  const now = new Date().toISOString();
  
  // Counters for filter statistics
  let skippedPhoneType = 0;
  let skippedCategory = 0;
  let skippedReviews = 0;
  
  for (let i = 0; i < sourceRecords.length; i++) {
    const source = sourceRecords[i];
    
    // Filter based on phone carrier type
    const carrierType = source['phone.phones_enricher.carrier_type'];
    if (carrierType && carrierType !== 'mobile' && carrierType !== 'voip' && carrierType !== '') {
      skippedPhoneType++;
      continue;
    }
    
    // Filter based on category
    const category = source.category || '';
    const type = source.type || '';
    if (!category.includes('HVAC contractor') && 
        !category.includes('Air conditioning contractor') && 
        !type.includes('HVAC contractor') && 
        !type.includes('Air conditioning contractor')) {
      skippedCategory++;
      continue;
    }
    
    // Filter based on review count
    const reviews = parseInt(source.reviews, 10) || 0;
    if (reviews <= 5 || reviews >= 300) {
      skippedReviews++;
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
      console.log(`Transformed ${i} Arkansas records so far...`);
    }
  }
  
  console.log(`Arkansas transformation complete with filters applied.`);
  console.log(`Skipped due to phone carrier type: ${skippedPhoneType}`);
  console.log(`Skipped due to category: ${skippedCategory}`);
  console.log(`Skipped due to review count: ${skippedReviews}`);
  console.log(`Generated ${transformedRecords.length} Arkansas records.`);
  
  // Write the Arkansas records to a new CSV file
  const arkansasCsvOutput = stringify(transformedRecords, { 
    header: true,
    columns: targetColumns 
  });
  
  fs.writeFileSync(targetPath, arkansasCsvOutput);
  console.log(`Arkansas filtered CSV written to: ${targetPath}`);
  
  // Now combine with the Alabama filtered data
  console.log('\nCombining with Alabama filtered data...');
  const alabamaPath = path.join(process.cwd(), 'filtered_companies.csv');
  
  if (!fs.existsSync(alabamaPath)) {
    console.error(`Alabama CSV file not found at ${alabamaPath}`);
    return;
  }
  
  const alabamaContent = fs.readFileSync(alabamaPath, 'utf8');
  const alabamaRecords = parse(alabamaContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${alabamaRecords.length} companies in Alabama CSV file`);
  
  // Combine the records (excluding the header from Arkansas since it's the same)
  const combinedRecords = [...alabamaRecords, ...transformedRecords];
  console.log(`Combined total: ${combinedRecords.length} companies`);
  
  // Write the combined records to a new CSV file
  const combinedPath = path.join(process.cwd(), 'combined_filtered_companies.csv');
  const combinedCsvOutput = stringify(combinedRecords, { 
    header: true,
    columns: targetColumns 
  });
  
  fs.writeFileSync(combinedPath, combinedCsvOutput);
  console.log(`Combined filtered CSV written to: ${combinedPath}`);
  
  // Clean the combined CSV to fix any formatting issues
  console.log('\nCleaning the combined CSV...');
  
  // Read the combined file
  const combinedContent = fs.readFileSync(combinedPath, 'utf8');
  const lines = combinedContent.split('\n');
  const header = lines[0];
  const headerColumns = header.split(',');
  console.log(`Header has ${headerColumns.length} columns`);
  
  // Clean and validate lines
  const cleanedLines = [header];
  let problemLines = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Count commas outside quoted fields
    let inQuotes = false;
    let commaCount = 0;
    
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (line[j] === ',' && !inQuotes) {
        commaCount++;
      }
    }
    
    // Header should have N-1 commas for N columns
    const expectedCommas = headerColumns.length - 1;
    
    if (commaCount === expectedCommas) {
      cleanedLines.push(line);
    } else {
      console.log(`Line ${i+1} has incorrect comma count: ${commaCount} (expected ${expectedCommas})`);
      problemLines++;
      // Skip this problematic line
    }
  }
  
  // Write the cleaned combined file
  const cleanedCombinedPath = path.join(process.cwd(), 'combined_filtered_cleaned.csv');
  fs.writeFileSync(cleanedCombinedPath, cleanedLines.join('\n'));
  
  console.log(`Combined cleanup complete!`);
  console.log(`Processed ${lines.length} lines`);
  console.log(`Found and skipped ${problemLines} problematic lines`);
  console.log(`Final cleaned combined CSV written to: ${cleanedCombinedPath}`);
  console.log(`Final record count: ${cleanedLines.length - 1} companies`);
}

// Run the transformation
processArkansasCsv().catch(err => {
  console.error('Error during processing:', err);
});