import { View, useWindowDimensions } from 'react-native';

import type { Board } from '../models/Board';
import type { Editor } from '../models/Editor';
import { styles } from '../styles/theme';
import { addDays } from '../utils/dates';
import { DayAgenda } from './planner/DayAgenda';
import { DaySelector } from './planner/DaySelector';
import { MealPlan } from './planner/MealPlan';

interface PlannerScreenProps {
  board: Board;
  day: string;
  selectDay: (day: string) => void;
  edit: (editor: Editor) => void;
  toggle: (id: string, done: boolean) => void;
  busy: boolean;
}

export function PlannerScreen({
  board,
  day,
  selectDay,
  edit,
  toggle,
  busy,
}: PlannerScreenProps) {
  const wide = useWindowDimensions().width >= 800;
  const days = Array.from({ length: 7 }, (_, offset) => addDays(board.start, offset));
  const recipeNames = new Map(board.recipes.map((recipe) => [recipe.id, recipe.title]));

  return (
    <View style={styles.stack}>
      <DaySelector days={days} day={day} board={board} onSelect={selectDay} />

      <View
        style={{
          flexDirection: wide ? 'row' : 'column',
          alignItems: wide ? 'flex-start' : 'stretch',
          gap: 14,
        }}
      >
        <DayAgenda
          day={day}
          board={board}
          recipeNames={recipeNames}
          wide={wide}
          edit={edit}
          toggle={toggle}
          busy={busy}
        />
        <MealPlan
          days={days}
          day={day}
          board={board}
          recipeNames={recipeNames}
          wide={wide}
          edit={edit}
        />
      </View>
    </View>
  );
}
