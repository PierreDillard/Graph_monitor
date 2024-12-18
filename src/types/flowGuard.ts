// types/flowGuards.ts
export function isValidPosition(position: unknown): position is { x: number, y: number } {
    return Boolean(
      position &&
      typeof (position as any).x === 'number' &&
      typeof (position as any).y === 'number' &&
      !isNaN((position as any).x) &&
      !isNaN((position as any).y)
    );
  }
  
