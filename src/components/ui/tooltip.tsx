import { cn } from "../../utils/cn";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipArrow = TooltipPrimitive.Arrow;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, side = 'top', ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    side={side}
    className={cn(
      "z-50 overflow-hidden rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-gray-300 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface CustomTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  maxWidth?: string; // Valeur dynamique pour la largeur
  maxHeight?: string; // Valeur dynamique pour la hauteur
}

 export const CustomTooltip: React.FC<CustomTooltipProps> = ({ content, children, side = 'top', maxWidth = "20rem", maxHeight = "8rem" }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <div 
            className="overflow-y-auto" 
            style={{ maxWidth, maxHeight }} // Appliquer les valeurs dynamiques
          >
            {content}
          </div>
          <TooltipArrow className="fill-gray-900" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};