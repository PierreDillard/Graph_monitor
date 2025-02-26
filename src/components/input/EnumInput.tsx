import React from 'react';
import { cn } from '../../utils/cn';

interface EnumInputProps {
  value?: string | number;
  onChange: (value: string | number | null) => void;
  options: string;
  rules?: { disabled?: boolean };
}

export const EnumInput: React.FC<EnumInputProps> = ({
  value,
  onChange,
  options,
  rules,
}) => {
  const parseOptions = React.useMemo(() => {
    if (!options) return [];

    return options.split('|').map((opt) => {
      const trimmedOpt = opt.trim();

      return {
        value: trimmedOpt,
        label: trimmedOpt,
      };
    });
  }, [options]);

  const defaultValue = parseOptions.length > 0 ? parseOptions[0].value : '';

  const actualValue =
    value === null || value === undefined ? defaultValue : value;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    onChange(selectedValue);

    // Log pour débogage
    console.log('EnumInput selected:', {
      selectedValue,
      optionType: typeof selectedValue,
      availableOptions: parseOptions,
    });
  };

  return (
    <select
      value={String(actualValue)}
      onChange={handleChange}
      disabled={rules?.disabled}
      className={cn(
        'w-full px-3 py-2 rounded-md text-sm',
        'bg-gray-700 border border-gray-600',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {parseOptions.map((opt, idx) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
