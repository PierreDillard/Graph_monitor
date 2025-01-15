import { useEffect, useState } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import { Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CustomTooltip } from '../ui/tooltip';
import { GPACTypes } from '../../types/gpac/arguments';
import {
  BooleanInput,
  NumberInput,
  StringInput,
  FractionInput,
} from '../input/index';
import { GPACArgumentType } from '../../types/gpac/arguments';
import { InputValue } from '../../types/gpac/arguments';
import { convertArgumentValue } from '../../utils/filtersArguments';


interface FilterArgumentBase {
  name: string;
  desc?: string;
  level?: 'normal' | 'advanced' | 'expert';
  default?: any;
  enums?: string[];
}

interface FilterArgumentInputProps<T extends keyof GPACTypes = keyof GPACTypes> {
  argument: FilterArgumentBase & {
    type: T;
  };
  value?: InputValue<T>;
  onChange: (value: InputValue<T> | null) => void;
  rules?: Record<string, any>;
  standalone?: boolean;
}


export const FilterArgumentInput = <T extends keyof GPACTypes>({
  argument,
  value,
  onChange,
  rules,
  standalone = false,
}: FilterArgumentInputProps<T>) => {

  const [localValue, setLocalValue] = useState<InputValue<T> | undefined>(value);
  const firstRender = useFirstMountState();


  useDebounce(
    () => {
      if (firstRender || localValue === value) return;
      const convertedValue = convertArgumentValue(localValue, argument.type);
      onChange(convertedValue);
    },
    1000,
    [localValue]
  );


  useEffect(() => {
    setLocalValue(value);
  }, [value]);


  const handleLocalChange = (newValue: any) => {
    setLocalValue(newValue);
  };


  const renderInput = () => {
    const inputProps = {
      value: localValue,
      onChange: handleLocalChange,
      rules: {
        ...rules,
        disabled: rules?.disabled,
      },
      argument,
    };


    switch (argument.type as GPACArgumentType) {
      case 'bool':
        return (
          <BooleanInput
            {...(inputProps as FilterArgumentInputProps<'bool'>)}
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
            {...(inputProps as FilterArgumentInputProps<'uint'>)}
          />
        );

      case 'frac':
      case 'lfrac':
        return (
          <FractionInput
            {...(inputProps as FilterArgumentInputProps<'frac'>)}
          />
        );

      case 'strl':
      case 'uintl':
      case 'sintl':
      case '4ccl':
      
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
            value={Array.isArray(localValue) ? localValue.join(',') : undefined}
            onChange={(val) => 
              handleLocalChange(val ? val.split(',').filter(Boolean) : null)
            }
          />
        );

      default:
        return (
          <StringInput
            {...(inputProps as FilterArgumentInputProps<'str'>)}
          />
        );
    }
  };

  if (standalone) return renderInput();


  return (
    <div
      className={cn(
        'flex items-center p-4 gap-4',
        'transition-all duration-200',
      
      )}
    >
      {/* Section titre et description */}
      <div className="flex-1 flex items-center gap-2">
        <span className="font-medium text-sm">{argument.name}</span>
        {argument.desc && (
          <CustomTooltip
            content={argument.desc}
            side="top"
            maxWidth="10rem"
            maxHeight="auto"
          >
            <Info className="w-4 h-4 text-gray-400 cursor-help 
                           hover:text-gray-300 transition-colors" />
          </CustomTooltip>
        )}
      </div>


      <div className="flex-1">{renderInput()}</div>
    </div>
  );
};


