import { View } from 'react-native';

import { styles } from '../styles/theme';
import { weekLabel } from '../utils/dates';
import { BodyText } from './BodyText';
import { Button } from './Button';

type WeekNavigationProps = {
  start: string;
  move: (days: number) => void;
  today: () => void;
};

export function WeekNavigation({ start, move, today }: WeekNavigationProps) {
  return (
    <View style={[styles.between, { gap: 8 }]}>
      <BodyText bold>{weekLabel(start)}</BodyText>
      <View style={[styles.row, { gap: 4 }]}>
        <Button onPress={() => move(-7)} label="Previous week">
          ‹
        </Button>
        <Button onPress={today}>This week</Button>
        <Button onPress={() => move(7)} label="Next week">
          ›
        </Button>
      </View>
    </View>
  );
}
