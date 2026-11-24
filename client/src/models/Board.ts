import type { Entry } from './Entry';
import type { Meal } from './Meal';
import type { Person } from './Person';
import type { Recipe } from './Recipe';
import type { ShoppingItem } from './ShoppingItem';

export interface Board {
  start: string;
  today: string;
  timeZone: string;
  people: Person[];
  recipes: Recipe[];
  entries: Entry[];
  meals: Meal[];
  shopping: ShoppingItem[];
}
