import { cn } from "../../../utils/cn";
import { forwardRef } from "react";
import { X } from "lucide-react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  onClear?: (value: null) => void;
  disabled?: boolean;
}

export const Container = forwardRef(
  ({ className, children, onClear, disabled, ...props }: ContainerProps, ref: React.Ref<HTMLDivElement>) => {
    return (
      <div ref={ref} className="flex w-full overflow-hidden rounded-md border border-gray-700">
        <div
          className={cn(
            "relative flex h-9 grow items-center transition-colors duration-150",
            "focus-within:border-blue-500/50 focus-within:bg-blue-900/10",
            "hover:border-gray-600 hover:bg-gray-700/30",
            disabled && "bg-gray-800/50 text-gray-500 cursor-not-allowed",
            className
          )}
          {...props}
        >
          {children}
        </div>
        {onClear && !disabled && (
          <button
            type="button"
            onClick={() => onClear(null)}
            className="px-2 hover:bg-gray-700"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);