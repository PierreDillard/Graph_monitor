import { Settings } from 'lucide-react';
import * as React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { GpacNodeData } from '../../types/gpac/model';
import { FilterArgumentInput } from '../ui/FilterArgumentInput';
import { useFilterArguments } from './hooks/useFilterArguments';
import { cn } from '../../utils/cn';

interface FilterArgumentsDialogProps {
  filter: GpacNodeData;
}

const FilterArgumentsDialog: React.FC<FilterArgumentsDialogProps> = ({ filter }) => {

  const renderArgumentInput = (arg: any) => {
    const type = arg.type || typeof arg.value;
    
    return (
      <FilterArgumentInput
        argument={{
          name: arg.name,
          type: type,
          desc: arg.desc,
          default: arg.default,
          level: arg.level || 'normal'
        }}
        value={arg.value}
        onChange={(newValue) => {
          const { setLocalValue } = useFilterArguments(filter.idx.toString(), arg.name);
          setLocalValue(newValue);
        }}
        rules={{
          disabled: false, 
          min: arg.min,
          max: arg.max,
          step: arg.step
        }}
      />
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className={cn(
            "inline-flex items-center justify-center rounded-md",
            "p-1 hover:bg-gray-700/50 transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-1",
            "focus-visible:ring-gray-400 disabled:pointer-events-none"
          )}
        >
          <Settings className="h-6 w-6 text-white" />
          <span className="sr-only">Open filter settings</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className={cn(
        "bg-gray-800 border-gray-700",
        "text-gray-100 shadow-lg"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {filter.name} Arguments
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure the filter parameters below. Changes will be applied in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="relative pt-4">
          <div className={cn(
            "space-y-4 max-h-[60vh] overflow-y-auto",
            "pr-2 pb-2 -mr-2",
            "scrollbar-thin scrollbar-thumb-gray-600",
            "scrollbar-track-gray-800/50"
          )}>
            {filter.gpac_args?.map((arg, index) => (
              <div 
                key={index} 
                className={cn(
                  "bg-gray-700/30 rounded-lg p-4",
                  "border border-gray-600/50",
                  "transition-colors duration-200",
                  "hover:bg-gray-700/50"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-100">
                        {arg.name}
                      </h4>
                      {arg.desc && (
                        <p className="text-sm text-gray-400 max-w-[300px]">
                          {arg.desc}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-mono bg-gray-900/50 px-2 py-1 rounded">
                      {arg.value !== undefined ? String(arg.value) : 'default'}
                    </div>
                  </div>
                  <div className="mt-2">
                    {renderArgumentInput(arg)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-gray-700 pt-4 mt-4">
     
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterArgumentsDialog;