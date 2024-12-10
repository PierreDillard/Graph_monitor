export class ZIndexManager {
    private static instance: ZIndexManager | null = null;
    private currentMaxZ: number = 10;
    private readonly baseZ: number = 10;
  
    private constructor() {}
  
    public static getInstance(): ZIndexManager {
      if (!ZIndexManager.instance) {
        ZIndexManager.instance = new ZIndexManager();
      }
      return ZIndexManager.instance;
    }
  
    // Instance method (not static)
    public getNextZIndex(): number {
      this.currentMaxZ += 1;
      return this.currentMaxZ;
    }
  
    public resetStack(): void {
      this.currentMaxZ = this.baseZ;
    }
  
    public getCurrentZ(): number {
      return this.currentMaxZ;
    }
  }
  
  // Export a singleton instance
  export const zIndexManager = ZIndexManager.getInstance();