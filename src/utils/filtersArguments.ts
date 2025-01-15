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