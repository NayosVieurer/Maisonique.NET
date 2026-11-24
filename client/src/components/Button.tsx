import { Pressable } from 'react-native';

import { colour, styles } from '../styles/theme';
import { BodyText } from './BodyText';

type ButtonProps = {
  children: string;
  onPress: () => void;
  tone?: 'normal' | 'primary' | 'danger';
  label?: string;
  disabled?: boolean;
};

export function Button({
  children,
  onPress,
  tone = 'normal',
  label,
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? children}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        tone === 'primary' && {
          backgroundColor: colour.green,
          borderColor: colour.green,
        },
        tone === 'danger' && { backgroundColor: colour.blush, borderColor: '#E6CBBF' },
        { opacity: disabled || pressed ? 0.65 : 1 },
      ]}
    >
      <BodyText
        bold
        style={{
          color:
            tone === 'primary' ? '#FFF' : tone === 'danger' ? colour.clay : colour.ink,
        }}
      >
        {children}
      </BodyText>
    </Pressable>
  );
}
