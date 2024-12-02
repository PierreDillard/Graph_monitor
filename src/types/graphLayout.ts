export type LayoutDirection = 'DOWN' | 'RIGHT';

export interface LayoutOptions {
  'elk.algorithm'?: string;
  'elk.direction'?: LayoutDirection;
  'elk.layered.spacing.nodeNodeBetweenLayers'?: number;
  'elk.spacing.nodeNode'?: number;
  'elk.padding'?: string;
  'elk.layered.crossingMinimization.strategy'?: string;
  'elk.layered.nodePlacement.strategy'?: string;
}