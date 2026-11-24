import type { Ingredient } from '../models/Ingredient';
import type { RecipeDraft } from '../models/RecipeDraft';

const unitNames: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  litre: 'l',
  litres: 'l',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  clove: 'clove',
  cloves: 'clove',
  tin: 'tin',
  tins: 'tin',
  pinch: 'pinch',
  pinches: 'pinch',
};

const fractionText: Record<string, string> = {
  '½': '1/2',
  '¼': '1/4',
  '¾': '3/4',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

const quantityPrefix = /^(?:(?:(\d+)\s+)?(\d+)\/(\d+)|(\d+(?:\.\d+)?|\.\d+))(\s*)(.+)$/;

const ambiguousQuantity = /^(?:[\d./–—×-]|x\s*\d|to\s+\d)/i;

const methodHeading = /^(method|instructions|directions|steps)\s*:?$/i;

export function readIngredient(line: string): Ingredient {
  const name = line.trim().replace(/^[-•*]\s+/, '');
  const unmeasured: Ingredient = { name, amount: null, unit: '' };
  const expanded = name
    .replace(/[½¼¾⅛⅜⅝⅞]/g, (glyph) => ' ' + fractionText[glyph])
    .trim();
  const matches = quantityPrefix.exec(expanded);

  if (!matches) {
    return unmeasured;
  }

  const [, whole, numerator, denominator, decimal, separator, tail] = matches;
  const amount = decimal
    ? Number(decimal)
    : Number(whole ?? 0) + Number(numerator) / Number(denominator);
  const remainder = tail.trim();
  const exceedsPrecision = Math.abs(Math.round(amount * 1000) - amount * 1000) > 1e-7;

  // Preserve ranges, multipacks and imprecise fractions for the cook to review.
  if (
    !Number.isFinite(amount) ||
    amount < 0.001 ||
    amount > 100_000 ||
    exceedsPrecision ||
    ambiguousQuantity.test(remainder)
  ) {
    return unmeasured;
  }

  const prefix = /^([a-z]+)\.?(?:\s+|$)/i.exec(remainder);
  const unit = prefix && unitNames[prefix[1].toLowerCase()];

  if (prefix && unit) {
    const ingredientName = remainder.slice(prefix[0].length).trim();
    return ingredientName ? { name: ingredientName, amount, unit } : unmeasured;
  }

  return separator && remainder ? { name: remainder, amount, unit: '' } : unmeasured;
}

export function readRecipe(text: string): RecipeDraft {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const ingredientsAt = lines.findIndex((line) => /^ingredients\s*:?$/i.test(line));
  const methodAt = lines.findIndex(
    (line, index) => index > ingredientsAt && methodHeading.test(line),
  );

  if (
    ingredientsAt < 1 ||
    methodAt <= ingredientsAt + 1 ||
    methodAt === lines.length - 1
  ) {
    throw new Error(
      'Include a title, an Ingredients heading with one ingredient per line, and a Method or Instructions heading with cooking steps.',
    );
  }

  const servingsLine = lines
    .slice(1, ingredientsAt)
    .map((line) => /^(?:serves|servings)\s*:?\s*(\d+)$/i.exec(line))
    .find(Boolean);

  return {
    title: lines[0],
    servings: servingsLine ? Number(servingsLine[1]) : 4,
    ingredients: lines.slice(ingredientsAt + 1, methodAt).map(readIngredient),
    steps: lines
      .slice(methodAt + 1)
      .map((line) => line.replace(/^(?:\d+[.)]|[-•*])\s+/, '')),
  };
}
