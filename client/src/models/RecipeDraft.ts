import type { Recipe } from './Recipe';

export type RecipeDraft = Omit<Recipe, 'id' | 'version'>;
