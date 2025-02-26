import React from 'react';
import { GpacNodeData } from '../../../../../types/domain/gpac';
import { Accordion, AccordionItem } from '../../../../ui/accordion';


interface PIDMetricsCardProps {
  data: GpacNodeData;
}

export const PIDMetricsCard: React.FC<PIDMetricsCardProps> = ({ data }) => {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Accordion>
        <AccordionItem 
          value="pid-distribution" 
          title="PID Distribution"
        >
          <div className="grid grid-cols-2 gap-4 bg-black   rounded-lg p-2">
            <div className="flex flex-col bg-black rounded_lg p-3">
              <span className="text-xs text-gray-400 mb-1">IPID</span>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold text-blue-400">
                  {data.nb_ipid}
                </span>
              </div>
              {Object.keys(data.ipid || {}).length > 0 && (
                <span className="text-xs text-gray-500 mt-1">
                  Active: {Object.keys(data.ipid).length}
                </span>
              )}
            </div>
            
            <div className="flex flex-col bg-black  p-3 rounded-lg">     
              <span className="text-xs text-gray-400 mb-1">OPID</span>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold text-green-400">
                  {data.nb_opid}
                </span>
              </div>
              {Object.keys(data.opid || {}).length > 0 && (
                <span className="text-xs text-gray-500 mt-1">
                  Active: {Object.keys(data.opid).length}
                </span>
              )}
            </div>
          </div>
        </AccordionItem>
      </Accordion>

      <Accordion>
        <AccordionItem 
          value="processing-type" 
          title="Processing Type"
        >
          <div className="flex flex-col items-center justify-between p-2 rounded-lg bg-black">
            <span className="text-sm text-gray-400 mx-2">Type</span>
            <span className="text-sm">{data.type}</span>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
};