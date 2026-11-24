import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Heading } from '../components/Heading';
import type { Board } from '../models/Board';
import type { Editor } from '../models/Editor';
import { styles } from '../styles/theme';

type HouseholdScreenProps = {
  board: Board;
  edit: (e: Editor) => void;
};

export function HouseholdScreen({ board, edit }: HouseholdScreenProps) {
  return (
    <Card>
      <View style={styles.between}>
        <Heading>People</Heading>
        <Button tone="primary" onPress={() => edit({ type: 'person' })}>
          Add person
        </Button>
      </View>
      {!board.people.length && (
        <BodyText small>
          Add a name and colour to assign events and chores to someone.
        </BodyText>
      )}
      {board.people.map((person) => (
        <View key={person.id} style={[styles.between, styles.rule]}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: person.colour }]} />
            <BodyText bold>{person.name}</BodyText>
          </View>
          <Button
            label={'Edit ' + person.name}
            onPress={() => edit({ type: 'person', item: person })}
          >
            Edit
          </Button>
        </View>
      ))}
      <BodyText small>Household time zone · {board.timeZone}</BodyText>
    </Card>
  );
}
