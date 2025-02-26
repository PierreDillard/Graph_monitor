import { BufferMetrics } from '../types/domain/monitoring';

export function analyzeBufferMetrics(
  buffer: number,
  bufferTotal: number,
): BufferMetrics {
  const isDynamic = bufferTotal === -1;
  const usagePercentage = isDynamic ? 0 : (buffer / bufferTotal) * 100;

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (!isDynamic) {
    if (usagePercentage > 90) status = 'critical';
    else if (usagePercentage > 75) status = 'warning';
  }

  return {
    current: buffer,
    total: bufferTotal,
    isDynamic,
    usagePercentage,
    status,
  };
}
/**
 * Parses a status string to extract FPS and latency metrics.
 *
 * @param status - The status string containing performance metrics.
 * @returns An object containing the parsed FPS and latency values.
 *
 * @example
 * const status = "Rendering at 60 FPS with latency 45 ms";
 * const metrics = parseFilterStatus(status);
 * // metrics => { fps: 60, latency: { value: 45, unit: 'ms' } }
 *
 * @description
 * This function is useful for extracting key performance indicators from
 * status messages. It employs regular expressions to identify and parse
 * numerical values associated with FPS and latency, allowing for easy
 * integration into performance monitoring systems.
 */

export function parseFilterStatus(status: string) {
  const metrics = {
    fps: null as number | null,
    latency: null as { value: number; unit: 'ms' | 's' } | null,
  };
  const fpsMatch = status.match(/(\d+\.?\d*)\s*FPS/);
  if (fpsMatch) {
    metrics.fps = parseFloat(fpsMatch[1]);
  }

  // Parse Latency
  const latencyMatch = status.match(/(\d+\.?\d*)\s*(ms|s)/);
  if (latencyMatch) {
    metrics.latency = {
      value: parseFloat(latencyMatch[1]),
      unit: latencyMatch[2] as 'ms' | 's',
    };
  }

  return metrics;
}
