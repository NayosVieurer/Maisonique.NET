import type { ReactNode } from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';

import { styles } from '../styles/theme';

type BodyTextProps = {
  children: ReactNode;
  small?: boolean;
  bold?: boolean;
  style?: StyleProp<TextStyle>;
};

export function BodyText({ children, small, bold, style }: BodyTextProps) {
  return (
    <Text style={[small ? styles.small : styles.body, bold && styles.strong, style]}>
      {children}
    </Text>
  );
}
