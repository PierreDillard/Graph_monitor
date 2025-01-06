import { cn } from '../../utils/cn';
import { 
  CustomTooltip
  } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { GPACTypes } from '../../types/gpac/arguments';
import { 
  FilterArgumentInputProps, 
  convertArgumentValue,
  InputValue 
} from '../filters/types/filterArgument';

import {
  BooleanInput,
  NumberInput,
  StringInput,
  FractionInput
} from '../input/index';

export const FilterArgumentInput = <T extends keyof GPACTypes>({
  argument,
  value,
  onChange,
  rules,
  standalone = false
}: FilterArgumentInputProps<T>) => {

  const { name, desc, level, type } = argument;

  const handleChange = (newValue: any) => {
    const convertedValue = convertArgumentValue(newValue, type);
    onChange(convertedValue);
  };


  const renderInput = () => {
   
    const inputValue = value as InputValue<T> | undefined;

    switch (argument.type as string) {
      case 'bool':
        return (
          <BooleanInput
            value={inputValue as boolean | undefined}
            onChange={handleChange}
            rules={rules}
          />
        );

      case 'uint':
      case 'sint':
      case 'luint':
      case 'lsint':
      case 'flt':
      case 'dbl':
        return (
          <NumberInput
            value={inputValue as number | undefined}
            onChange={handleChange}
            rules={rules}
          />
        );

      case 'frac':
      case 'lfrac':
        return (
          <FractionInput
            value={inputValue as string | undefined}
            onChange={handleChange}
            rules={rules}
          />
        );

      case 'strl':
      case 'uintl':
      case 'sintl':
      case '4ccl':
        // For list types, convert the array to a string
        // 
        return (
          <StringInput
            value={Array.isArray(inputValue) ? inputValue.join(',') : undefined}
            onChange={(val) => handleChange(val?.split(','))}
            rules={rules}
          />
        );

      default:
        return (
          <StringInput
            value={inputValue as string | undefined}
            onChange={handleChange}
            rules={rules}
          />
        );
    }
  };

  if (standalone) return renderInput();


  return (
    <div className={cn(
      "flex items-center p-4 gap-4",
      level === 'advanced' && "border-l-4 border-yellow-500",
      level === 'expert' && "border-l-4 border-red-500"
    )}>
      <div className="flex-1 flex items-center gap-2">
        <span className="font-medium">{name}</span>
        {desc && (
      
          <CustomTooltip 
            content={desc} 
            side="top" 
            maxWidth="10rem" 
            maxHeight="auto" 
          >
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </CustomTooltip>
        )}
      </div>
      
      <div className="flex-1">
        {renderInput()}
      </div>
    </div>
  );
};