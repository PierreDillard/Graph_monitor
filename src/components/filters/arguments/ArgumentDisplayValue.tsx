interface ArgumentDisplayValueProps {
    value: any;
    isEditable?: boolean;
  }
  
  export const ArgumentDisplayValue: React.FC<ArgumentDisplayValueProps> = ({ value, isEditable }) => {
    const formatValue = (val: any): string => {
      if (val === null || val === undefined) {
        return 'N/A';
      }
  
      // Array of objects
      if (Array.isArray(val)) {
        try {
          return `[${val.map(item => {
            if (typeof item === 'object') {
              return Object.entries(item)
                .map(([k, v]) => `${k}:${v}`)
                .join(', ');
            }
            return String(item);
          }).join(' | ')}]`;
        } catch {
          return '[Complex Array]';
        }
      }
  
      // Object
      if (typeof val === 'object' && val !== null) {
        try {
          const entries = Object.entries(val)
            .map(([key, value]) => `${key}:${value}`)
            .join(', ');
          return `{ ${entries} }`;
        } catch {
          return '{Complex Object}';
        }
      }
  
      // Simple value
      return String(val);
    };
  
    return (
      <div className={`font-mono text-sm p-1 rounded ${
        isEditable ? 'bg-blue-900/20' : 'bg-gray-800'
      }`}>
        {formatValue(value)}
      </div>
    );
  };