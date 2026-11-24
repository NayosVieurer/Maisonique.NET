import type { Versioned } from './Versioned';

export interface Person extends Versioned {
  name: string;
  colour: string;
}
