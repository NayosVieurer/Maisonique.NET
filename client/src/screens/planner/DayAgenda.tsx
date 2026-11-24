import { Pressable, StyleSheet, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CheckItem } from '../../components/CheckItem';
import { Heading } from '../../components/Heading';
import type { Board } from '../../models/Board';
import type { Editor } from '../../models/Editor';
import { colour, styles } from '../../styles/theme';
import { displayDay } from '../../utils/dates';

interface DayAgendaProps {
  board: Board;
  day: string;
  recipeNames: ReadonlyMap<string, string>;
  wide: boolean;
  edit: (editor: Editor) => void;
  toggle: (id: string, done: boolean) => void;
  busy: boolean;
}

export function DayAgenda({
  board,
  day,
  recipeNames,
  wide,
  edit,
  toggle,
  busy,
}: DayAgendaProps) {
  const entries = board.entries.filter((entry) => entry.day === day);
  const meals = board.meals.filter((meal) => meal.day === day);

  return (
    <Card style={wide ? { flex: 1.22 } : undefined}>
      <Heading>
        {displayDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}
      </Heading>

      {!entries.length && !meals.length && (
        <BodyText small>No events, chores or meals planned for this day.</BodyText>
      )}

      {entries.map((entry) => {
        const person = board.people.find((person) => person.id === entry.personId);
        const time = entry.startTime
          ? [entry.startTime, entry.endTime].filter(Boolean).join('–')
          : 'All day';
        const detail = [time, person?.name ?? 'Everyone'].join(' · ');
        const open = () => edit({ type: 'entry', item: entry, day });

        return (
          <View key={entry.id} style={[styles.rule, agenda.row]}>
            <View
              style={[
                agenda.personMark,
                { backgroundColor: person?.colour ?? colour.green },
              ]}
            />

            {entry.kind === 'chore' ? (
              <>
                <CheckItem
                  label={entry.title}
                  detail={detail}
                  checked={entry.done}
                  disabled={busy}
                  onPress={() => toggle(entry.id, !entry.done)}
                />
                <Button label={'Edit ' + entry.title} onPress={open}>
                  Edit
                </Button>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Edit ' + entry.title}
                onPress={open}
                style={[styles.grow, agenda.openEvent]}
              >
                <BodyText bold>{entry.title}</BodyText>
                <BodyText small>{detail}</BodyText>
              </Pressable>
            )}
          </View>
        );
      })}

      {meals.map((meal) => (
        <Pressable
          key={meal.id}
          accessibilityRole="button"
          accessibilityLabel={'Edit ' + meal.slot + ' on ' + day}
          onPress={() => edit({ type: 'meal', day, item: meal })}
          style={agenda.meal}
        >
          <BodyText small bold>
            {meal.slot} · {meal.servings} servings
          </BodyText>
          <BodyText>{recipeNames.get(meal.recipeId)}</BodyText>
        </Pressable>
      ))}

      <View style={styles.row}>
        <Button tone="primary" onPress={() => edit({ type: 'entry', day })}>
          Add event or chore
        </Button>
      </View>
    </Card>
  );
}

const agenda = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personMark: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  openEvent: { minHeight: 44, justifyContent: 'center' },
  meal: { padding: 12, borderRadius: 10, backgroundColor: colour.sage },
});
