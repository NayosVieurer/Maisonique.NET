import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { styles } from '../styles/theme';

type HeadingProps = {
  children: ReactNode;
  large?: boolean;
};

export function Heading({ children, large }: HeadingProps) {
  return (
    <Text accessibilityRole="header" style={large ? styles.title : styles.heading}>
      {children}
    </Text>
  );
}
