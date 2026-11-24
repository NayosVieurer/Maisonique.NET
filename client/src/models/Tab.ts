export const tabs = ['Planner', 'Recipes', 'Shopping', 'Household'] as const;

export type Tab = (typeof tabs)[number];

export const tabTitles: Record<Tab, string> = {
  Planner: 'Week planner',
  Recipes: 'Cookbook',
  Shopping: 'Shopping list',
  Household: 'Household',
};
