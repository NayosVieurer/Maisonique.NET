import { deepStrictEqual, equal, throws } from 'node:assert/strict';
import test from 'node:test';
import { readIngredient, readRecipe } from '../client/src/services/parseRecipe.ts';

test('measured ingredients, countables and uncertain quantities', () => {
  deepStrictEqual(readIngredient('200g pasta'), { name: 'pasta', amount: 200, unit: 'g' });
  deepStrictEqual(readIngredient('1½ tablespoons olive oil'), { name: 'olive oil', amount: 1.5, unit: 'tbsp' });
  deepStrictEqual(readIngredient('2 lemons'), { name: 'lemons', amount: 2, unit: '' });
  for (const line of ['2 × 400 g tins of tomatoes', '1–2 onions', '1/3 cup oats', 'Salt to taste']) {
    deepStrictEqual(readIngredient(line), { name: line, amount: null, unit: '' });
  }
});
test('pasted recipe is an editable draft', () => {
  const draft = readRecipe('Porridge\nServes 2\nIngredients:\n• 70 g oats\nMethod\n1. Simmer.\n2. Serve.');
  equal(draft.title, 'Porridge');
  equal(draft.servings, 2);
  equal(draft.ingredients[0].amount, 70);
  deepStrictEqual(draft.steps, ['Simmer.', 'Serve.']);
  throws(() => readRecipe('Porridge\n70 g oats'), /Ingredients heading/);
});
