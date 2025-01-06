import { Input } from '../ui/input';


interface FractionInputProps {
    value?: string | number;
    onChange: (value: string | null) => void;
    rules?: { disabled?: boolean };
  }
  
  export const FractionInput: React.FC<FractionInputProps> = ({ value, onChange, rules }) => {

    const parseFraction = (val: string | number | undefined): [number, number] => {
        // if no value return [0, 1]
        if (val === undefined || val === null) {
          return [0, 1];
        }

        if (typeof val === 'number') {
          return [val, 1];
        }
    
        // Parse fraction
        if (typeof val === 'string') {
          const parts = val.split('/');
          if (parts.length === 2) {
            const num = parseInt(parts[0]);
            const den = parseInt(parts[1]);
            if (!isNaN(num) && !isNaN(den) && den !== 0) {
              return [num, den];
            }
          } else if (parts.length === 1) {
            const num = parseInt(parts[0]);
            if (!isNaN(num)) {
              return [num, 1];
            }
          }
        }
    
        //Echec return [0, 1]
        return [0, 1];
      };
    
      // ParserINITIAL VALUE
      const [num, den] = parseFraction(value);
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={num}
            onChange={(e) => {
              const newNum = parseInt(e.target.value);
              if (!isNaN(newNum)) {
                onChange(`${newNum}/${den}`);
              } else {
                onChange(null);
              }
            }}
            disabled={rules?.disabled}
            className="w-20 bg-gray-700 border-gray-600"
          />
          <span className="text-gray-400">/</span>
          <Input
            type="number"
            value={den}
            onChange={(e) => {
              const newDen = parseInt(e.target.value);
              if (!isNaN(newDen) && newDen !== 0) {
                onChange(`${num}/${newDen}`);
              }
            }}
            disabled={rules?.disabled}
            className="w-20 bg-gray-700 border-gray-600"
            min="1" 
          />
        </div>
      );
    };