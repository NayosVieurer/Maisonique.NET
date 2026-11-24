import { useState } from 'react';
import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { ChoiceButton } from '../components/ChoiceButton';
import { TextField } from '../components/TextField';
import type { Board } from '../models/Board';
import type { Meal } from '../models/Meal';
import type { Recipe } from '../models/Recipe';
import { slots, type Slot } from '../models/Slot';
import { styles } from '../styles/theme';
import { newId } from '../utils/newId';
import { EditorForm } from './EditorForm';
import type { FormProps } from './FormProps';

type MealFormProps = FormProps & {
  board: Board;
  day: string;
  item?: Meal;
  recipe?: Recipe;
};

export function MealForm({
  board,
  day: initialDay,
  item,
  recipe,
  ...actions
}: MealFormProps) {
  const [id] = useState(() => item?.id ?? newId());
  const [day, setDay] = useState(item?.day ?? initialDay);
  const [slot, setSlot] = useState<Slot>(item?.slot ?? 'Dinner');
  const [recipeId, setRecipe] = useState(
    item?.recipeId ?? recipe?.id ?? board.recipes[0]?.id ?? '',
  );
  const [servings, setServings] = useState(
    String(
      item?.servings ??
        board.recipes.find((option) => option.id === recipeId)?.servings ??
        4,
    ),
  );

  return (
    <EditorForm
      {...actions}
      title={item ? 'Edit planned meal' : 'Plan a meal'}
      path={'/meals/' + id}
      version={item?.version ?? 0}
      data={() => ({ day, slot, recipeId, servings: Number(servings) })}
    >
      <TextField
        label="Date"
        placeholder="YYYY-MM-DD"
        value={day}
        onChangeText={setDay}
      />
      <BodyText small bold>
        Meal
      </BodyText>
      <View style={styles.row}>
        {slots.map((mealSlot) => (
          <ChoiceButton
            key={mealSlot}
            title={mealSlot}
            active={slot === mealSlot}
            onPress={() => setSlot(mealSlot)}
          />
        ))}
      </View>
      <BodyText small bold>
        Recipe
      </BodyText>
      <View style={styles.row}>
        {board.recipes.map((option) => (
          <ChoiceButton
            key={option.id}
            title={option.title}
            active={option.id === recipeId}
            onPress={() => {
              setRecipe(option.id);
              setServings(String(option.servings));
            }}
          />
        ))}
      </View>
      <TextField
        label="Planned servings"
        inputMode="numeric"
        value={servings}
        onChangeText={setServings}
      />
    </EditorForm>
  );
}
