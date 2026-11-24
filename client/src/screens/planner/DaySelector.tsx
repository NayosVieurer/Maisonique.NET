import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BodyText } from '../../components/BodyText';
import type { Board } from '../../models/Board';
import { colour, fonts } from '../../styles/theme';
import { displayDay } from '../../utils/dates';

interface DaySelectorProps {
  days: string[];
  day: string;
  board: Board;
  onSelect: (day: string) => void;
}

export function DaySelector({ days, day, board, onSelect }: DaySelectorProps) {
  const { width } = useWindowDimensions();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Days of the week"
      style={[strip.row, { gap: width < 500 ? 2 : 7 }]}
    >
      {days.map((date) => {
        const selected = date === day;
        const today = date === board.today;
        const hasItems =
          board.entries.some((entry) => entry.day === date) ||
          board.meals.some((meal) => meal.day === date);
        const foreground = selected ? '#FFFFFF' : colour.ink;
        const marker = selected ? '#DCE9BC' : colour.clay;
        const label = displayDay(date, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        return (
          <Pressable
            key={date}
            accessibilityRole="tab"
            aria-selected={selected}
            accessibilityState={{ selected }}
            accessibilityLabel={today ? label + ', today' : label}
            onPress={() => onSelect(date)}
            style={({ pressed }) => [
              strip.day,
              pressed && { backgroundColor: colour.sage },
              selected && { backgroundColor: colour.green },
            ]}
          >
            <BodyText
              small
              bold
              style={{ color: foreground, fontSize: width < 420 ? 11 : 13 }}
            >
              {displayDay(date, { weekday: 'short' })}
            </BodyText>
            <BodyText style={[strip.digit, { color: foreground }]}>
              {Number(date.slice(8))}
            </BodyText>
            <View
              style={[
                strip.marker,
                {
                  width: today ? 16 : 5,
                  backgroundColor: hasItems || today ? marker : 'transparent',
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const strip = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: colour.cream,
    borderWidth: 1,
    borderColor: colour.line,
  },
  day: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 10, gap: 1 },
  digit: { fontFamily: fonts.title, fontSize: 24, lineHeight: 28 },
  marker: { height: 4, borderRadius: 2 },
});
