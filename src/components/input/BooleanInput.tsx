import { Switch } from '../ui/switch';

interface BooleanInputProps {
  value?: boolean;
  onChange: (value: boolean | null) => void;
  rules?: { disabled?: boolean };
}

export const BooleanInput: React.FC<BooleanInputProps> = ({
  value,
  onChange,
  rules,
}) => {
  return (
    <Switch
      checked={value || false}
      onCheckedChange={onChange}
      disabled={rules?.disabled}
      className="data-[state=checked]:bg-blue-600"
    />
  );
};
