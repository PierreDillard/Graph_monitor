import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionContextType {
  expandedItems: Set<string>;
  toggleExpanded: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  defaultExpanded?: string[];
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  defaultExpanded = [],
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded),
  );

  const toggleExpanded = (value: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleExpanded }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  value: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  value,
}) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const { expandedItems, toggleExpanded } = context;
  const isExpanded = expandedItems.has(value);

  return (
    <div className=" rounded-lg bg-gray-800/50">
      <button
        onClick={() => toggleExpanded(value)}
        className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-200 hover:bg-gray-700/50 transition-colors rounded-lg"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ease-out ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 border-t border-gray-700">{children}</div>
      </div>
    </div>
  );
};
