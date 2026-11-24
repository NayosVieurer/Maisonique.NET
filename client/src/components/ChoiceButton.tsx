import { View, Pressable } from 'react-native';

import { styles } from '../styles/theme';
import { BodyText } from './BodyText';

type ChoiceButtonProps = {
  title: string;
  active: boolean;
  onPress: () => void;
  label?: string;
  dot?: string;
};

export function ChoiceButton({ title, active, onPress, label, dot }: ChoiceButtonProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label ?? title}
      aria-checked={active}
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        active && styles.active,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.row, { gap: 6 }]}>
        {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
        <BodyText small bold={active}>
          {title}
        </BodyText>
      </View>
    </Pressable>
  );
}
