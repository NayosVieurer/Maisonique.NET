import type { Ingredient } from './Ingredient';
import type { Versioned } from './Versioned';

export interface Recipe extends Versioned {
  title: string;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
}
