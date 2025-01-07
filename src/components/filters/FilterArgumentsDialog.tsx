import React, { useMemo } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { FilterArgumentDialogProps } from './types/filterArgument';
import { cn } from '../../utils/cn';

const FilterArgumentDialog: React.FC<FilterArgumentDialogProps> = ({
  filter,
  onArgumentUpdate,
  open,
  onOpenChange
}) => {
  const level = filter.gpac_args.hint;
  console.log('level', level)
  const sortedArguments = useMemo(() => {
    return (filter.gpac_args || []).sort((a, b) => {
      const hintOrder = { 
        normal: 0, 
        advanced: 1, 
        expert: 2 
      };
      return hintOrder[a.hint || 'normal'] - hintOrder[b.hint || 'normal'];
    });
  }, [filter.gpac_args]);

  const renderArgumentSection = (hint: 'normal' | 'advanced' | 'expert') => {
    const args = sortedArguments.filter(arg => (arg.hint || 'normal') === hint);
    if (!args.length) return null;

    return (
      <div className="mb-6">
        <h3 className={cn(
          "text-sm font-medium mb-2",
          hint === 'advanced' && "text-yellow-400",
          hint === 'expert' && "text-red-400"
        )}>
          {hint.charAt(0).toUpperCase() + hint.slice(1)} Parameters
        </h3>
        <div className="space-y-4">
          {args.map((arg) => (
            <div 
              key={arg.name}
              className={cn(
                "bg-gray-700/30 rounded-lg p-4 border border-gray-600/50",
                !arg.update && "opacity-50"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{arg.name}</h4>
                  {arg.desc && (
                    <p className="text-sm text-gray-400">{arg.desc}</p>
                  )}
                </div>
                <div className="text-sm font-mono bg-gray-900/50 px-2 py-1 rounded">
                  {arg.value !== undefined 
                    ? String(arg.value) 
                    : arg.default !== undefined 
                      ? String(arg.default)
                      : 'undefined'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-md p-1 hover:bg-gray-700/50 transition-colors">
          <Settings className="h-6 w-6 text-white" />
          <span className="sr-only">Filter Settings</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {filter.name} Arguments
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure available filter parameters. Some parameters cannot be modified during execution.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 relative overflow-y-auto max-h-[60vh]">
          {renderArgumentSection('normal')}
          {renderArgumentSection('advanced')}
          {renderArgumentSection('expert')}
        </div>

        <DialogFooter className="border-t border-gray-700 pt-4">
          <p className="text-xs text-gray-500">
            Some parameters are read-only during filter execution
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default FilterArgumentDialog;