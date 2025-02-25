import { Settings, Check, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { GpacNodeData } from '../../types/gpac/model';
import { FilterArgumentInput } from './FilterArgumentInput';
import { ArgumentDisplayValue } from './arguments/ArgumentDisplayValue';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/badge';
import { 
  selectArgumentUpdate,
  updateFilterArgument 
} from '../../store/slices/filterArgumentSlice';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks/redux';

interface FilterArgumentsDialogProps {
  filter: GpacNodeData;
}

const FilterArgumentsDialog: React.FC<FilterArgumentsDialogProps> = ({ filter }) => {
  // Keep track of pending changes
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  // Track open state to handle reset of pendingChanges
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  
  

  const argumentUpdates = useSelector((state: RootState) => 
    filter.gpac_args?.reduce((acc, arg) => {
      acc[arg.name] = selectArgumentUpdate(state, filter.idx.toString(), arg.name);
      return acc;
    }, {} as Record<string, any>)
  );
  
  // useEffect hook
  useEffect(() => {
    if (isOpen) {
      setPendingChanges({});
    }
  }, [isOpen]);
  
  const handleValueChange = (argName: string, newValue: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [argName]: newValue
    }));
    
    console.log(`Value changed for ${argName}:`, newValue);
  };
  
  const renderArgumentInput = (arg: any) => {
    const type = arg.type || typeof arg.value;
    const hasChange = pendingChanges[arg.name] !== undefined;
    // Get update status from our pre-fetched object instead of calling useSelector here
    const updateStatus = argumentUpdates?.[arg.name];
    
    
    return (
      <div className="relative">
        {/* Status indicator */}
        {updateStatus?.status === 'pending' && (
          <div className="absolute right-0 top-0 -mt-1 -mr-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
        )}
        {updateStatus?.status === 'success' && (
          <div className="absolute right-0 top-0 -mt-1 -mr-1">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
        {updateStatus?.status === 'error' && (
          <div className="absolute right-0 top-0 -mt-1 -mr-1" title={updateStatus.error}>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        )}
        
        <FilterArgumentInput
          argument={{
            name: arg.name,
            type: type,
            desc: arg.desc,
            hint: arg.hint,
            default: arg.default,
            min_max_enum: arg.min_max_enum,
            update: !!arg.update,
            update_sync: !!arg.update_sync
          }}
          value={hasChange ? pendingChanges[arg.name] : arg.value}
          onChange={(newValue) => {
            handleValueChange(arg.name, newValue);
          }}
          rules={{
            disabled: !arg.update,
            min: arg.min,
            max: arg.max,
            step: arg.step
          }}
          // Don't pass filterId here as we'll handle updates with the Apply button
        />
      </div>
    );
  };

  return (
    <Dialog onOpenChange={setIsOpen}>
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
      
      <DialogContent
        className={cn(
          "bg-gray-800 border-gray-700",
          "text-gray-100 shadow-lg",
          "max-w-[90vw] md:max-w-md",
          "w-full"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {filter.name} Arguments
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure the filter parameters below and click Apply to save changes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative pt-4">
          <div
            className={cn(
              "space-y-4 max-h-[60vh] overflow-y-auto",
              "pr-2 pb-2 -mr-2",
              "scrollbar-thin scrollbar-thumb-gray-600",
              "scrollbar-track-gray-800/50"
            )}
          >
            {filter.gpac_args?.map((arg, index) => (
              <div 
                key={index} 
                className={cn(
                  "bg-gray-700/30 rounded-lg p-4",
                  "border border-gray-600/50",
                  "transition-colors duration-200",
                  "hover:bg-gray-700/50",
                  arg.update ? "border-green-500/20" : "",
                  pendingChanges[arg.name] !== undefined ? "border-blue-500/50 bg-blue-900/10" : ""
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium text-gray-100 flex items-center gap-2">
                        {arg.name}
                        {arg.update ? (
                          <Badge variant="success" className="text-xs">
                            Updatable
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-700/30 text-gray-400 border-gray-600/30">
                            Read-only
                          </Badge>
                        )}
                        {arg.update_sync && (
                          <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-400 border-blue-500/30">
                            Sync
                          </Badge>
                        )}
                      </h4>
                      
                      {arg.desc && (
                        <p className="text-sm text-gray-400 max-w-[300px]">
                          {arg.desc}
                        </p>
                      )}
                      
                      {arg.hint && (
                        <p className="text-xs text-gray-500">
                          Hint: <span className="font-mono">{arg.hint}</span>
                        </p>
                      )}
                      
                      {arg.default !== undefined && (
                        <p className="text-xs text-gray-500">
                          Default: <span className="font-mono">{String(arg.default)}</span>
                        </p>
                      )}
                      
                      {arg.min_max_enum && (
                        <p className="text-xs text-gray-500">
                          Constraints: <span className="font-mono">{arg.min_max_enum}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className={cn(
                      "text-sm font-mono px-2 py-1 rounded",
                      pendingChanges[arg.name] !== undefined 
                        ? "bg-blue-900/30 text-blue-300" 
                        : "bg-gray-900/50"
                    )}>
                      <ArgumentDisplayValue 
                        value={pendingChanges[arg.name] !== undefined 
                          ? pendingChanges[arg.name] 
                          : arg.value}
                        isEditable={!!arg.update}
                      />
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
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={() => setPendingChanges({})}
              disabled={Object.keys(pendingChanges).length === 0}
            >
              Reset
            </Button>
         

<Button 
  variant="default"
  disabled={Object.keys(pendingChanges).length === 0}
  onClick={() => {
    // Log all pending changes
    console.log("***Pending changes to apply:", pendingChanges);
    
    // Apply all pending changes
    Object.entries(pendingChanges).forEach(([argName, value]) => {
      const arg = filter.gpac_args?.find(a => a.name === argName);
      
      // Log detailed information about the argument being updated
      console.log(`***Updating argument:`, {
        uiArgName: argName,
        actualArgName: arg?.name,
        argValue: value,
        argObject: arg
      });
      
      if (arg?.update) {
        console.log(`***Dispatching updateFilterArgument:`, {
          filterId: filter.idx.toString(),
          argName: argName,
          value: value
        });
        
        dispatch(updateFilterArgument(
          filter.idx.toString(),
          argName,
          value
        ));
      } else {
        console.log(`Not updating - argument not marked as updatable:`, argName);
      }
    });
    
    // Clear pending changes after applying
    setPendingChanges({});
  }}
>
  Apply Changes
</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterArgumentsDialog;