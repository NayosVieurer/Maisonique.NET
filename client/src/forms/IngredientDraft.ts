import type { Ingredient } from '../models/Ingredient';
import { newId } from '../utils/newId';

export interface IngredientDraft {
  key: string;
  name: string;
  amount: string;
  unit: string;
}

export function makeIngredientDraft(ingredient?: Ingredient): IngredientDraft {
  return {
    key: newId(),
    name: ingredient?.name ?? '',
    amount: ingredient?.amount?.toString() ?? '',
    unit: ingredient?.unit ?? '',
  };
}

export function ingredientFromDraft(draft: IngredientDraft): Ingredient {
  const amount = draft.amount.trim();

  if (amount && !/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(amount)) {
    throw new Error(
      'Use a decimal such as 0.5 for an ingredient amount, or leave it blank.',
    );
  }

  return { name: draft.name, amount: amount ? Number(amount) : null, unit: draft.unit };
}
