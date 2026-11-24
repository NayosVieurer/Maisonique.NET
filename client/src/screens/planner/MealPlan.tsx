import { Pressable, StyleSheet, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Heading } from '../../components/Heading';
import type { Board } from '../../models/Board';
import type { Editor } from '../../models/Editor';
import { styles } from '../../styles/theme';
import { displayDay } from '../../utils/dates';

interface MealPlanProps {
  days: string[];
  day: string;
  board: Board;
  recipeNames: ReadonlyMap<string, string>;
  wide: boolean;
  edit: (editor: Editor) => void;
}

export function MealPlan({ days, day, board, recipeNames, wide, edit }: MealPlanProps) {
  const hasRecipes = board.recipes.length > 0;

  function addMeal(date: string) {
    edit(hasRecipes ? { type: 'meal', day: date } : { type: 'recipe' });
  }

  return (
    <Card style={wide ? { flex: 1 } : undefined}>
      <View style={styles.between}>
        <Heading>Meal plan</Heading>
        <Button onPress={() => addMeal(day)}>
          {hasRecipes ? 'Plan meal' : 'Add recipe'}
        </Button>
      </View>

      {days.map((date) => {
        const meals = board.meals.filter((meal) => meal.day === date);

        return (
          <View key={date} style={[styles.rule, plan.dayRow]}>
            <View style={plan.dateLabel}>
              <BodyText small bold>
                {displayDay(date, { weekday: 'short' })} {Number(date.slice(8))}
              </BodyText>
            </View>

            <View style={[styles.grow, plan.meals]}>
              {meals.map((meal) => (
                <Pressable
                  key={meal.id}
                  accessibilityRole="button"
                  accessibilityLabel={'Edit ' + meal.slot + ' for ' + date}
                  style={plan.meal}
                  onPress={() => edit({ type: 'meal', day: date, item: meal })}
                >
                  <BodyText small>{meal.slot}</BodyText>
                  <BodyText bold>{recipeNames.get(meal.recipeId)}</BodyText>
                </Pressable>
              ))}

              {!meals.length && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={'Plan a meal for ' + date}
                  style={[plan.meal, { paddingTop: 3 }]}
                  onPress={() => addMeal(date)}
                >
                  <BodyText small>+ Add meal</BodyText>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const plan = StyleSheet.create({
  dayRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dateLabel: { width: 62, paddingTop: 4 },
  meals: { gap: 4 },
  meal: { minHeight: 44 },
});
