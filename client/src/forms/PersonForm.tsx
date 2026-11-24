import { useState } from 'react';
import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { ChoiceButton } from '../components/ChoiceButton';
import { TextField } from '../components/TextField';
import type { Person } from '../models/Person';
import { palette, styles } from '../styles/theme';
import { newId } from '../utils/newId';
import { EditorForm } from './EditorForm';
import type { FormProps } from './FormProps';

type PersonFormProps = FormProps & { item?: Person };

export function PersonForm({ item, ...actions }: PersonFormProps) {
  const [id] = useState(() => item?.id ?? newId());
  const [name, setName] = useState(item?.name ?? '');
  const [colour, setColour] = useState(item?.colour ?? palette[0].value);

  return (
    <EditorForm
      {...actions}
      title={item ? 'Edit person' : 'Add person'}
      path={'/people/' + id}
      version={item?.version ?? 0}
      data={() => ({ name, colour })}
    >
      <TextField label="Name" value={name} onChangeText={setName} maxLength={60} />
      <BodyText small bold>
        Calendar colour
      </BodyText>
      <View style={styles.row}>
        {palette.map((option) => (
          <ChoiceButton
            key={option.value}
            title={option.name}
            dot={option.value}
            active={colour === option.value}
            onPress={() => setColour(option.value)}
          />
        ))}
      </View>
    </EditorForm>
  );
}
