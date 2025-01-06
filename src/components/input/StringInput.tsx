import { Input } from '../ui/input';

interface StringInputProps {
    value?: string;
    onChange: (value: string | null) => void;
    rules?: { 
      disabled?: boolean;
      placeholder?: string;
    };
  }
  
  export const StringInput: React.FC<StringInputProps> = ({ value, onChange, rules }) => {
    return (
      <Input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={rules?.placeholder}
        disabled={rules?.disabled}
        className="bg-gray-700 border-gray-600"
      />
    );
  };
  