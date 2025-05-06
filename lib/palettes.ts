import { CompanyColors } from '@/types';

/**
 * Default color palette for HVAC template
 */
export const HVAC_FALLBACK_PALETTE: CompanyColors = {
  primary: "#2563EB",
  secondary: "#0891B2"
};

/**
 * Gets the company colors with fallbacks for missing values
 * @param company Company data from database
 * @returns CompanyColors with all required values
 */
export function getCompanyColors(company?: any): CompanyColors {
  // Check if primary_color is valid (not null, not "N/A", and a proper hex color)
  const isValidPrimaryColor = 
    company?.primary_color && 
    company.primary_color !== "N/A - Null from API" &&
    company.primary_color !== "null" &&
    /^#[0-9A-F]{6}$/i.test(company.primary_color);
  
  // Check if secondary_color is valid (not null, not "N/A", and a proper hex color)
  const isValidSecondaryColor = 
    company?.secondary_color && 
    company.secondary_color !== "N/A - Null from API" &&
    company.secondary_color !== "null" &&
    /^#[0-9A-F]{6}$/i.test(company.secondary_color);
  
  return {
    primary: isValidPrimaryColor ? company.primary_color : HVAC_FALLBACK_PALETTE.primary,
    secondary: isValidSecondaryColor ? company.secondary_color : HVAC_FALLBACK_PALETTE.secondary,
  };
}