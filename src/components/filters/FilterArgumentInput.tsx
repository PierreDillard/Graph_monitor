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
  EnumInput,
} from '../input/index';
import { GPACArgumentType } from '../../types/gpac/arguments';
import { InputValue } from '../../types/gpac/arguments';
import { convertArgumentValue } from '../../utils/filtersArguments';
import { updateFilterArgument } from '../../store/slices/filterArgumentSlice';
import { useAppDispatch } from '../../hooks/redux';
import { isEnumArgument } from '../../utils/filtersArguments';


interface FilterArgumentBase {
  name: string;
  desc?: string;
  hint?: string;
  default?: any;
  min_max_enum?: string; 
  update?: boolean;
  update_sync?: boolean;  
}

interface FilterArgumentInputProps<T extends keyof GPACTypes = keyof GPACTypes> {
  argument: FilterArgumentBase & {
    type: T;
  };
  value?: InputValue<T>;
  onChange: (value: InputValue<T> | null) => void;
  rules?: Record<string, any>;
  standalone?: boolean;
  filterId?: string;
}


export const FilterArgumentInput = <T extends keyof GPACTypes>({
  argument,
  value,
  onChange,
  rules,
  standalone = false,
  filterId,
}: FilterArgumentInputProps<T>) => {

  const [localValue, setLocalValue] = useState<InputValue<T> | undefined>(value);
  const firstRender = useFirstMountState();
  const dispatch = useAppDispatch();
 

  useDebounce(
    () => {
      if (firstRender || localValue === value) return;
      
      const convertedValue = convertArgumentValue(localValue, argument.type);
      
      // Call the parent onChange handler
      onChange(convertedValue);
      
      // If the argument is updatable and we have a filterId, dispatch the update action
      if (argument.update && filterId) {
        dispatch(updateFilterArgument(
          filterId,
          argument.name,
          convertedValue
        ));
      }
    },
    300,
    [localValue, filterId, argument.update]
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
     // Détection des énumérations en vérifiant le min_max_enum
  if (argument.min_max_enum && (
    // Vérifier si c'est au format d'énumération
    argument.min_max_enum.includes('|') || 
    argument.min_max_enum.includes('=')
  )) {
    if (isEnumArgument(argument)) {
    return (
      <EnumInput
      value={localValue as string | number}
      onChange={(newValue) => {
        // Nous nous assurons de ne jamais envoyer null pour un enum
        handleLocalChange(newValue !== null ? newValue : 
          // Utiliser la première option comme fallback
          argument.min_max_enum?.split('|')[0]?.trim() || '');
      }}
      options={argument.min_max_enum || ''}
      rules={inputProps.rules}
    />
    );
  }
  }


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


