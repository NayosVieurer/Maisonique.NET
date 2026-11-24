import type { Entry } from './Entry';
import type { Meal } from './Meal';
import type { Person } from './Person';
import type { Recipe } from './Recipe';
import type { RecipeDraft } from './RecipeDraft';

export type Editor =
  | { type: 'entry'; day: string; item?: Entry }
  | { type: 'meal'; day: string; item?: Meal; recipe?: Recipe }
  | { type: 'recipe'; item?: Recipe; draft?: RecipeDraft }
  | { type: 'person'; item?: Person };
