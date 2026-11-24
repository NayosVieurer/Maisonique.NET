import { View } from 'react-native';

import { colour } from '../styles/theme';
import { BodyText } from './BodyText';

type ErrorNoticeProps = { text: string };

export function ErrorNotice({ text }: ErrorNoticeProps) {
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colour.blush, borderRadius: 8, padding: 12 }}
    >
      <BodyText style={{ color: colour.clay }}>{text}</BodyText>
    </View>
  );
}
