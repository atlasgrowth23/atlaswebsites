// Auto-formatting utilities for inputs

export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export const formatSerialNumber = (value: string): string => {
  // Common serial number formats: AB-12345, AB12345, 12345-ABC
  let formatted = value.toUpperCase();
  
  // Remove spaces and normalize
  formatted = formatted.replace(/\s+/g, '');
  
  // Add dash after letters if not present
  if (/^[A-Z]{2,3}\d/.test(formatted) && !formatted.includes('-')) {
    const letterMatch = formatted.match(/^[A-Z]+/);
    if (letterMatch) {
      const letters = letterMatch[0];
      const rest = formatted.slice(letters.length);
      formatted = `${letters}-${rest}`;
    }
  }
  
  return formatted;
};

export const formatModelNumber = (value: string): string => {
  // Common model formats: ABC-123, ABC123, 123ABC
  let formatted = value.toUpperCase();
  
  // Remove extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
};

export const formatFilterSize = (value: string): string => {
  // Common filter formats: 16x25x1, 16 x 25 x 1, 16x25
  let formatted = value.toLowerCase();
  
  // Remove spaces around 'x'
  formatted = formatted.replace(/\s*x\s*/g, 'x');
  
  // Ensure proper format: NNxNNxN or NNxNN
  const filterMatch = formatted.match(/^(\d+)x(\d+)(?:x(\d+))?$/);
  if (filterMatch) {
    const [, width, height, depth] = filterMatch;
    if (depth) {
      formatted = `${width}x${height}x${depth}`;
    } else {
      formatted = `${width}x${height}`;
    }
  }
  
  return formatted;
};

export const formatAddress = (value: string): string => {
  // Basic address formatting
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Hook for auto-formatting inputs
export const useAutoFormat = (type: 'phone' | 'serial' | 'model' | 'filter' | 'address') => {
  const formatValue = (value: string): string => {
    switch (type) {
      case 'phone':
        return formatPhoneNumber(value);
      case 'serial':
        return formatSerialNumber(value);
      case 'model':
        return formatModelNumber(value);
      case 'filter':
        return formatFilterSize(value);
      case 'address':
        return formatAddress(value);
      default:
        return value;
    }
  };
  
  return { formatValue };
};