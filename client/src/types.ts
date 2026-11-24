export type Kind = 'event' | 'chore';
export const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
export type Slot = typeof slots[number];

export interface Versioned { id: string; version: number }
export interface Person extends Versioned { name: string; colour: string }
export interface Ingredient { name: string; amount: number | null; unit: string }
export interface Recipe extends Versioned {
  title: string; servings: number; ingredients: Ingredient[]; steps: string[];
}
export interface Entry extends Versioned {
  day: string; kind: Kind; title: string; personId: string | null;
  startTime: string | null; endTime: string | null; done: boolean;
}
export interface Meal extends Versioned { day: string; slot: Slot; recipeId: string; servings: number }
export interface ShoppingItem {
  id: string; label: string; amount: number | null; unit: string; done: boolean; manual: boolean;
}
export interface Board {
  start: string; today: string; timeZone: string; people: Person[]; recipes: Recipe[];
  entries: Entry[]; meals: Meal[]; shopping: ShoppingItem[];
}
export type Editor =
  | { type: 'entry'; day: string; item?: Entry }
  | { type: 'meal'; day: string; item?: Meal; recipe?: Recipe }
  | { type: 'recipe'; item?: Recipe; draft?: Omit<Recipe, 'id' | 'version'> }
  | { type: 'person'; item?: Person };
