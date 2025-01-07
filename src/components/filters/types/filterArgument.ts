import { GPACTypes } from '../../../types/gpac/index'; 
import { GpacNodeData } from '../../../types/gpac/index';

interface ArgumentRule {
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  }
  
  export type InputValue<T extends keyof GPACTypes> = 
  T extends 'bool' ? boolean :
  T extends 'uint' | 'sint' | 'luint' | 'lsint' | 'flt' | 'dbl' ? number :
  T extends 'frac' | 'lfrac' ? string :
  T extends 'str' | 'cstr' | '4cc' ? string :
  T extends 'strl' | 'uintl' | 'sintl' | '4ccl' ? string[] :
  string;


  export interface FilterArgumentInputProps<T extends keyof GPACTypes = keyof GPACTypes> {
    argument: {
      name: string;
      type: T;
      desc?: string;
      default?: GPACTypes[T];
      enums?: string[];
      level?: 'normal' | 'advanced' | 'expert';
    };
    value: GPACTypes[T] | undefined;
    onChange: (value: InputValue<T> | null) => void;
    rules?: ArgumentRule;
    standalone?: boolean;
  }

  export const convertArgumentValue = <T extends keyof GPACTypes>(
    value: any, 
    type: T
  ): InputValue<T> | null => {
    if (value === null || value === undefined) {
      return null;
    }
  
    if (type === 'bool') {
      return Boolean(value) as InputValue<T>;
    } else if (type as string === 'uint' || type as string === 'sint' || type as string === 'luint' || type as string === 'lsint' || type as string === 'flt' || type as string === 'dbl') {
      return Number(value) as InputValue<T>;
    } else if (type === 'frac' || type === 'lfrac') {

      if (typeof value === 'string' && /^\d+\/\d+$/.test(value)) {
        return value as InputValue<T>;
      }
      return null;
    } else if (type === 'strl' || type === 'uintl' || type === 'sintl' || type === '4ccl') {
      return (Array.isArray(value) ? value : [value]) as InputValue<T>;
    } else {
      return String(value) as InputValue<T>;
    }
  };

  export interface GpacArgument {
    name: string;
    type: keyof GPACTypes;
    value?: GPACTypes[keyof GPACTypes];
    desc?: string;
    default?: GPACTypes[keyof GPACTypes];
    update?: boolean;
    update_sync?: boolean;
    hint?: 'normal' | 'advanced' | 'expert';
  }
  
  // Types pour le dialogue
  export interface FilterArgumentDialogProps {
    filter: GpacNodeData;
    onArgumentUpdate: (key: string, value: GPACTypes[keyof GPACTypes] | null) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }