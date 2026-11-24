export const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

export type Slot = (typeof slots)[number];
