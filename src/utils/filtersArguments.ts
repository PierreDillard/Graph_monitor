import { GPACTypes } from '../types/gpac/index';
import { InputValue } from '../types/gpac/arguments';


export function convertArgumentValue<T extends keyof GPACTypes>(
    value: any,
    type: T
  ): InputValue<T> | null {
    if (value === null || value === undefined) return null;
  
    switch (type) {
      case 'bool':
        return Boolean(value) as InputValue<T>;
      case 'uint':
      case 'sint':
      case 'luint':
      case 'lsint':
      case 'flt':
      case 'dbl':
        return Number(value) as InputValue<T>;
      case 'frac':
      case 'lfrac':
        return String(value) as InputValue<T>;
      default:
        return value as InputValue<T>;
    }
  }


/**
 * Determines if an argument is of enum type by analyzing its metadata
 */
export function isEnumArgument(argument: any): boolean {

  if (!argument) return false;
  
  
  if (argument.type === 'enum') return true;
  
  
  if (argument.min_max_enum && (
    argument.min_max_enum.includes('|') 
  )) {
    return true;
  }
  
  // Case 3: Detection by naming convention for certain known GPAC filters
  const enumArgNames = ['mode', 'layout', 'preset', 'profile', 'level', 'format'];
  if (enumArgNames.some(name => argument.name.toLowerCase().includes(name))) {
    
    return !!argument.min_max_enum;
  }
  
  return false;
}