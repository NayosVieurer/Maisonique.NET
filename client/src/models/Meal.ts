import type { Slot } from './Slot';
import type { Versioned } from './Versioned';

export interface Meal extends Versioned {
  day: string;
  slot: Slot;
  recipeId: string;
  servings: number;
}
