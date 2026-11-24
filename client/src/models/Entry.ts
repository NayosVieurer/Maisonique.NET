import type { Kind } from './Kind';
import type { Versioned } from './Versioned';

export interface Entry extends Versioned {
  day: string;
  kind: Kind;
  title: string;
  personId: string | null;
  startTime: string | null;
  endTime: string | null;
  done: boolean;
}
