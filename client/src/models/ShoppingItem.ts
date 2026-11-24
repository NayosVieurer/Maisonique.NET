export interface ShoppingItem {
  id: string;
  label: string;
  amount: number | null;
  unit: string;
  done: boolean;
  manual: boolean;
}
