/**
 * Gets a contrasting color suitable for use on top of a background color
 * @param hex The hex color code for the background (e.g., "#2563eb")
 * @returns A color (white or black) that will contrast well with the background
 */
export function contrastColor(hex: string): string {
  if (!hex) return "#ffffff"; // Default white for contrast on dark colors
  
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using the sRGB color space formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  r = r / 255;
  g = g / 255;
  b = b / 255;

  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}