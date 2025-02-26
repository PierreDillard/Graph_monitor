
import { Input } from '../ui/input';
import { useState, useEffect } from 'react';
import { useDebounce, useFirstMountState } from 'react-use';
import type { FilterArgumentInputProps } from '../../types/domain/gpac/index';

export const StringInput: React.FC<FilterArgumentInputProps<"str">> = ({ 
  argument, 
  value, 
  onChange, 
  rules 
}) => {
  const [localValue, setLocalValue] = useState<string>(value ?? '');
  const firstRender = useFirstMountState();

  useDebounce(
    () => {
      if (firstRender || localValue === value) return;
      onChange(localValue || null);
    },
    1000,
    [localValue]
  );

  useEffect(() => setLocalValue(value ?? ''), [value]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={rules?.placeholder}
      disabled={rules?.disabled}
      className="bg-gray-700 border-gray-600 hover:bg-gray-600/50 focus:ring-blue-500"
    />
  );
};