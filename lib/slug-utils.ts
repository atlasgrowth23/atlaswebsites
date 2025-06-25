// Consistent slug generation for business names
function createBusinessSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with single dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

// SQL function to generate the same slug in database queries
const SQL_SLUG_FUNCTION = `
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\\s]', '', 'g'), 
        '\\s+', '-', 'g'
      ), 
      '-+', '-', 'g'
    ), 
    '-'
  )
`;

module.exports = { createBusinessSlug, SQL_SLUG_FUNCTION };
export { createBusinessSlug, SQL_SLUG_FUNCTION };