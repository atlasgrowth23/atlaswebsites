/**
 * Color utility functions for HVAC website templates
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  text: {
    onPrimary: string;
    onSecondary: string;
    dark: string;
    light: string;
  }
  background: {
    light: string;
    dark: string;
  }
}

// HVAC industry standard colors
export const HVAC_DEFAULT_PALETTE: ColorPalette = {
  primary: "#2563EB", // Blue
  secondary: "#DC2626", // Red
  text: {
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    dark: "#1F2937",
    light: "#F9FAFB"
  },
  background: {
    light: "#F9FAFB",
    dark: "#111827"
  }
};

/**
 * Gets a contrasting color suitable for use on top of a background color
 * @param hex The hex color code for the background (e.g., "#2563eb")
 * @returns A color (white or black) that will contrast well with the background
 */
export function getContrastColor(hexColor: string): string {
  if (!hexColor || !/^#[0-9A-F]{6}$/i.test(hexColor)) return "#FFFFFF";

  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

// Generate a complete palette from company colors
export function generatePalette(primaryColor?: string, secondaryColor?: string): ColorPalette {
  // Start with default palette
  const palette = {...HVAC_DEFAULT_PALETTE};

  // Apply company colors if available and valid
  if (primaryColor && /^#[0-9A-F]{6}$/i.test(primaryColor)) {
    palette.primary = primaryColor;
    palette.text.onPrimary = getContrastColor(primaryColor);
  }

  if (secondaryColor && /^#[0-9A-F]{6}$/i.test(secondaryColor)) {
    palette.secondary = secondaryColor;
    palette.text.onSecondary = getContrastColor(secondaryColor);
  }

  return palette;
}

// For backwards compatibility (maintaining the original function name)
export const contrastColor = getContrastColor;