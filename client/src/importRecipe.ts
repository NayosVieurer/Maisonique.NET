import type { Ingredient, Recipe } from './types';

export type RecipeDraft = Omit<Recipe, 'id' | 'version'>;
const units: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', l: 'l', litre: 'l', litres: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb',
  clove: 'clove', cloves: 'clove', tin: 'tin', tins: 'tin', pinch: 'pinch', pinches: 'pinch',
};
const fractions: Record<string, string> = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };

export function readIngredient(line: string): Ingredient {
  const name = line.trim().replace(/^[-•*]\s+/, '');
  const free = { name, amount: null, unit: '' };
  const expanded = name.replace(/[½¼¾⅛⅜⅝⅞]/g, c => ' ' + fractions[c]).trim();
  const match = /^(?:(?:(\d+)\s+)?(\d+)\/(\d+)|(\d+(?:\.\d+)?|\.\d+))(\s*)(.+)$/.exec(expanded);
  if (!match) return free;
  const amount = match[4] ? Number(match[4]) : Number(match[1] ?? 0) + Number(match[2]) / Number(match[3]);
  const rest = match[6].trim();
  // Leave ranges, multipacks and imprecise fractions verbatim for the cook to review.
  if (!Number.isFinite(amount) || amount < 0.001 || amount > 100000 ||
      Math.abs(Math.round(amount * 1000) - amount * 1000) > 1e-7 ||
      /^(?:[\d./–—×-]|x\s*\d|to\s+\d)/i.test(rest)) return free;
  const prefix = /^([a-z]+)\.?(?:\s+|$)/i.exec(rest);
  const unit = prefix ? units[prefix[1].toLowerCase()] : undefined;
  if (prefix && unit) {
    const ingredient = rest.slice(prefix[0].length).trim();
    return ingredient ? { name: ingredient, amount, unit } : free;
  }
  return match[5] && rest ? { name: rest, amount, unit: '' } : free;
}

export function readRecipe(text: string): RecipeDraft {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const ingredients = lines.findIndex(line => /^ingredients\s*:?$/i.test(line));
  const method = lines.findIndex((line, i) => i > ingredients && /^(method|instructions|directions|steps)\s*:?$/i.test(line));
  if (ingredients < 1 || method <= ingredients + 1 || method === lines.length - 1)
    throw new Error('Include a title, an Ingredients heading with one ingredient per line, and a Method or Instructions heading with cooking steps.');
  const portions = lines.slice(1, ingredients).map(s => /^(?:serves|servings)\s*:?\s*(\d+)$/i.exec(s)).find(Boolean);
  const servings = portions ? Number(portions[1]) : 4;
  return {
    title: lines[0], servings,
    ingredients: lines.slice(ingredients + 1, method).map(readIngredient),
    steps: lines.slice(method + 1).map(line => line.replace(/^(?:\d+[.)]|[-•*])\s+/, '')),
  };
}
