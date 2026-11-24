import { View, Pressable } from 'react-native';

import { colour, styles } from '../styles/theme';
import { BodyText } from './BodyText';

type CheckItemProps = {
  label: string;
  checked: boolean;
  onPress: () => void;
  detail?: string;
  disabled?: boolean;
};

export function CheckItem({ label, checked, onPress, detail, disabled }: CheckItemProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      aria-checked={checked}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, { minHeight: 44, flex: 1, flexWrap: 'nowrap' }]}
    >
      <View
        style={{
          width: 27,
          height: 27,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: colour.green,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? colour.green : colour.card,
        }}
      >
        {checked && (
          <BodyText bold style={{ color: '#FFF' }}>
            ✓
          </BodyText>
        )}
      </View>
      <View style={styles.grow}>
        <BodyText
          style={
            checked ? { textDecorationLine: 'line-through', color: colour.mute } : {}
          }
        >
          {label}
        </BodyText>
        {!!detail && <BodyText small>{detail}</BodyText>}
      </View>
    </Pressable>
  );
}
