import { Input } from '../ui/input';

interface NumberInputProps {
  value?: number;
  onChange: (value: number | null) => void;
  rules?: {
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  rules,
}) => {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? null : Number(e.target.value);
        onChange(val);
      }}
      min={rules?.min}
      max={rules?.max}
      step={rules?.step}
      disabled={rules?.disabled}
      className="bg-gray-700 border-gray-600"
    />
  );
};
