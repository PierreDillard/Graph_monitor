import React from 'react';
import { GpacNodeData } from '../../../../../types/domain/gpac';
import { formatBytes } from '../../../../../utils/filterMonitorUtils';
import { Accordion, AccordionItem } from '../../../../ui/accordion';

const BufferStatus: React.FC<{
  name: string;
  buffer: number;
  bufferTotal: number;
  type: 'input' | 'output';
}> = React.memo(({ name, buffer, bufferTotal }) => {
  const isDynamic = bufferTotal === -1;
  // validation for buffer values
  const validBuffer = Number.isFinite(buffer) ? buffer : 0;
  const validBufferTotal =
    Number.isFinite(bufferTotal) && bufferTotal > 0 ? bufferTotal : 0;

  const usage =
    isDynamic || validBufferTotal === 0
      ? 0
      : (validBuffer / validBufferTotal) * 100;

  // Normalize usage to prevent strange values
  const normalizedUsage = Math.min(100, Math.max(0, usage));

  return (
    <div className="flex items-center justify-between p-2 bg-black rounded">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(normalizedUsage)}`}
        />
        <span className="text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        {!isDynamic && (
          <div className="text-sm">{normalizedUsage.toFixed(1)}%</div>
        )}
        <div className="text-sm text-gray-400">
          {formatBytes(validBuffer)}
          {!isDynamic &&
            validBufferTotal > 0 &&
            ` / ${formatBytes(validBufferTotal)}`}
        </div>
      </div>
    </div>
  );
});

// Helper function for status colors
const getStatusColor = (usage: number): string => {
  if (usage > 90) return 'bg-red-500';
  if (usage > 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

// BufferMonitoring Component for displaying all buffers

const BufferMonitoring: React.FC<{
  data: GpacNodeData;
}> = React.memo(({ data }) => {
  return (
    <div className="space-y-4">
      {/* Input Buffers Accordion */}
      {data.nb_ipid > 0 && (
        <Accordion>
          <AccordionItem value="input-buffers" title="Input Buffers">
            <div className="space-y-2">
              {Object.entries(data.ipid || {}).map(
                ([name, pid]: [string, any]) => (
                  <BufferStatus
                    key={name}
                    name={name}
                    buffer={pid.buffer}
                    bufferTotal={pid.buffer_total}
                    type="input"
                  />
                ),
              )}
            </div>
          </AccordionItem>
        </Accordion>
      )}

      {/* Output Buffers Accordion */}
      {data.nb_opid > 0 && (
        <Accordion>
          <AccordionItem value="output-buffers" title="Output Buffers">
            <div className="space-y-2">
              {Object.entries(data.opid || {}).map(
                ([name, pid]: [string, any]) => (
                  <BufferStatus
                    key={name}
                    name={name}
                    buffer={pid.buffer}
                    bufferTotal={pid.buffer_total}
                    type="output"
                  />
                ),
              )}
            </div>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
});

// Les displayNames restent inchangés
BufferStatus.displayName = 'BufferStatus';
BufferMonitoring.displayName = 'BufferMonitoring';

export default BufferMonitoring;
