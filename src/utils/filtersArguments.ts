

export function convertArgumentValue(value: any, type: string): any {
  if (value === null || value === undefined) return null;
  
  // Handle specific types
  switch (type) {
    case 'bool':
      return !!value;
      
    case 'uint':
    case 'sint':
    case 'luint':
    case 'lsint':
      return parseInt(value, 10);
      
    case 'flt':
    case 'dbl':
      return parseFloat(value);
      
    case 'frac':
    case 'lfrac':
      // Ensure consistent fraction format (num/den)
      if (typeof value === 'string' && value.includes('/')) {
        return value;
      } else if (typeof value === 'object' && 'num' in value && 'den' in value) {
        return `${value.num}/${value.den}`;
      } else {
        return `${value}/1`; // Default denominator
      }
      
    // For list types, ensure they're properly formatted
    case 'strl':
    case 'uintl':
    case 'sintl':
    case '4ccl':
      if (Array.isArray(value)) {
        return value.join(',');
      }
      return String(value);
      
    default:
      return String(value);
  }
}


/**
 * Determines if an argument is of enum type by analyzing its metadata
 */
export function isEnumArgument(argument: any): boolean {
  // Check for explicit enum type
  if (argument.type === 'enum') return true;
  
  // Check min_max_enum format that indicates an enum
  if (argument.min_max_enum && (
    argument.min_max_enum.includes('|') || 
    argument.min_max_enum.includes('=')
  )) {
  
    const parts = argument.min_max_enum.split('|');
    if (parts.length > 1) {
      // Multiple options separated by |
      return true;
    }
    
    // Check for key=value pairs
    if (parts[0].includes('=')) {
      return true;
    }
  }
  
  return false;
}