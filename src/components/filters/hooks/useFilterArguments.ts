import { useState, useEffect } from 'react';
import { useDebounce } from 'react-use';
import { gpacService } from '../../../services/gpacService';



export const useFilterArguments = (filterId: string, argumentName: string) => {
    const [localValue, setLocalValue] = useState<string | number | boolean | string[] | null>('');
const[ isPending, setIsPending ] = useState<boolean>(false);

useEffect(() => {

    return () => {
      setLocalValue('');
      setIsPending(false);
    };
  }, [filterId, argumentName]);

useDebounce(
    () => {
      if (localValue === undefined) return;
      
      const updateArg = async () => {
        try {
          setIsPending(true);
          await gpacService.sendMessage({
            type: 'update_arg',
            idx: parseInt(filterId),
            argName: name,
            newValue: localValue
          });
        } catch (error) {
          console.error('Failed to update argument:', error);
        } finally {
          setIsPending(false);
        }
      };

      updateArg();
    },
    1000,
    [localValue]
  );

  return {
    localValue,
    setLocalValue,
    isPending
  };
};