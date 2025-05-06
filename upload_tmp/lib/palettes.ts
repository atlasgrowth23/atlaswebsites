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
  return {
    primary: company?.primary_color || HVAC_FALLBACK_PALETTE.primary,
    secondary: company?.secondary_color || HVAC_FALLBACK_PALETTE.secondary,
  };
}