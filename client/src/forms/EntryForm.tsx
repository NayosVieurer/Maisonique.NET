import { useState } from 'react';
import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { ChoiceButton } from '../components/ChoiceButton';
import { TextField } from '../components/TextField';
import type { Board } from '../models/Board';
import type { Entry } from '../models/Entry';
import type { Kind } from '../models/Kind';
import { styles } from '../styles/theme';
import { newId } from '../utils/newId';
import { EditorForm } from './EditorForm';
import type { FormProps } from './FormProps';

type EntryFormProps = FormProps & {
  board: Board;
  day: string;
  item?: Entry;
};

export function EntryForm({ board, day: initialDay, item, ...actions }: EntryFormProps) {
  const [id] = useState(() => item?.id ?? newId());
  const [day, setDay] = useState(item?.day ?? initialDay);
  const [kind, setKind] = useState<Kind>(item?.kind ?? 'event');
  const [title, setTitle] = useState(item?.title ?? '');
  const [personId, setPerson] = useState<string | null>(item?.personId ?? null);
  const [start, setStart] = useState(item?.startTime ?? '');
  const [end, setEnd] = useState(item?.endTime ?? '');

  return (
    <EditorForm
      {...actions}
      title={item ? 'Edit calendar item' : 'Add to calendar'}
      path={'/entries/' + id}
      version={item?.version ?? 0}
      data={() => ({
        day,
        kind,
        title,
        personId,
        startTime: start.trim() || null,
        endTime: end.trim() || null,
      })}
    >
      <View style={styles.row}>
        {(['event', 'chore'] as const).map((entryKind) => (
          <ChoiceButton
            key={entryKind}
            title={entryKind === 'event' ? 'Event' : 'Chore'}
            active={kind === entryKind}
            onPress={() => setKind(entryKind)}
          />
        ))}
      </View>
      <TextField label="Title" value={title} onChangeText={setTitle} maxLength={140} />
      <TextField
        label="Date"
        placeholder="YYYY-MM-DD"
        value={day}
        onChangeText={setDay}
      />
      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            label="Start time"
            placeholder="HH:MM"
            value={start}
            onChangeText={setStart}
          />
        </View>
        <View style={styles.grow}>
          <TextField
            label="End time"
            placeholder="HH:MM"
            value={end}
            onChangeText={setEnd}
          />
        </View>
      </View>
      <BodyText small>Leave both times blank for an all-day item.</BodyText>
      <BodyText small bold>
        Assigned to
      </BodyText>
      <View style={styles.row}>
        <ChoiceButton
          title="Everyone"
          active={personId === null}
          onPress={() => setPerson(null)}
        />
        {board.people.map((person) => (
          <ChoiceButton
            key={person.id}
            title={person.name}
            dot={person.colour}
            active={personId === person.id}
            onPress={() => setPerson(person.id)}
          />
        ))}
      </View>
    </EditorForm>
  );
}
