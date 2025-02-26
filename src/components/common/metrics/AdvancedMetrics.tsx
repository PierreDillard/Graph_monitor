import React from 'react';
import { GpacNodeData } from '../../../types/domain/gpac/model';
import { Activity, Cpu, Package } from 'lucide-react';
import { Accordion, AccordionItem } from '../../ui/accordion';
import FPSMetric from './FPSMetric';

interface AdvancedMetricsProps {
  data: GpacNodeData;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = React.memo(
  ({ data }) => {
    const firstPidWithFPS =
      Object.values(data.ipid as Record<string, any>).find(
        (pid) => pid.FPS && 'val' in pid.FPS,
      ) ||
      Object.values(data.opid as Record<string, any>).find(
        (pid) => pid.FPS && 'val' in pid.FPS,
      );

    const processingTime = data.time / 1000;
    const codecInfo = data.codec || 'Unknown';
    const streamType = data.streamtype || 'Unknown';

    return (
      <div className="space-y-4 mt-4">
        <Accordion
          defaultExpanded={['codec', 'processing', 'performance', 'stats']}
        >
          {/* Section Codec Information */}
          <AccordionItem title="Codec Information" value="codec">
            <div className="space-y-2 bg-black p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-400" />
                <div className="flex justify-between w-full text-sm min-w-0">
                  <span className="text-gray-400">Codec:</span>
                  <span className="font-medium text-blue-400 text-right">
                    {codecInfo}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400">Stream Type:</span>
                <span className="font-medium text-green-400 text-right">
                  {streamType}
                </span>
              </div>
            </div>
          </AccordionItem>

          {/* Section Processing Stats */}
          <AccordionItem title="Processing Statistics" value="processing">
            <div className="space-y-2 bg-black p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-purple-400" />
                <div className="flex justify-between w-full text-sm min-w-0">
                  <span className="text-gray-400">Processing Time:</span>
                  <span className="font-medium text-purple-400">
                    {processingTime.toFixed(2)}s
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm min-w-0">
                <span className="text-gray-400">Packets Done:</span>
                <span className="font-medium text-cyan-400">
                  {data.pck_done?.toLocaleString()}
                </span>
              </div>
            </div>
          </AccordionItem>

          {/* Section Performance Metrics */}
          {firstPidWithFPS?.FPS && (
            <AccordionItem title="Performance Metrics" value="performance">
              <div className="flex items-center gap-2 mb-3 bg-black p-3 rounded-lg">
                <Activity className="w-4 h-4 text-yellow-400" />
                <FPSMetric fps={firstPidWithFPS.FPS} />
              </div>
            </AccordionItem>
          )}

          {/* Section Additional Statistics */}
          <AccordionItem title="Additional Statistics" value="stats">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black p3 rounded-lg text-center">
                <div className="text-xs text-gray-400 mb-1">Packets Sent</div>
                <div className="font-medium text-orange-400">
                  {data.pck_sent?.toLocaleString()}
                </div>
              </div>
              <div className="bg-black p3 rounded-lg text-center">
                <div className="text-xs text-gray-400 mb-1">Tasks</div>
                <div className="font-medium text-teal-400">
                  {data.tasks?.toLocaleString() ?? 0}
                </div>
              </div>
              <div className="bg-black p3 rounded-lg text-center">
                <div className="text-xs text-gray-400 mb-1">Errors</div>
                <div className="font-medium text-red-400">
                  {data.errors?.toLocaleString() ?? 0}
                </div>
              </div>
              <div className="bg-black p3 rounded-lg text-center">
                <div className="text-xs text-gray-400 mb-1">
                  Interface Packets
                </div>
                <div className="font-medium text-indigo-400">
                  {data.pck_ifce_sent?.toLocaleString() ?? 0}
                </div>
              </div>
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
);

export default AdvancedMetrics;
