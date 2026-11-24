import type { ReactNode } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';

import { styles } from '../styles/theme';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}
