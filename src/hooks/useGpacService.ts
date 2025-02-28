import { gpacService } from '@/services/gpacService';

/**
 * Hook that provides properly typed access to the GpacService instance
 * @returns The global GpacService instance with proper typing
 */
export const useGpacService = () => {
  // Define the type based on the actual instance
  type GpacService = typeof gpacService;
  

  return gpacService as GpacService;
};