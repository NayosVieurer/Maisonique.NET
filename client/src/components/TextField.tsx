import { View, TextInput, type TextInputProps } from 'react-native';

import { styles } from '../styles/theme';
import { BodyText } from './BodyText';

type TextFieldProps = TextInputProps & { label: string };

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <BodyText small bold>
        {label}
      </BodyText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#647268"
        {...props}
        style={[
          styles.input,
          props.multiline && { minHeight: 85, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}
