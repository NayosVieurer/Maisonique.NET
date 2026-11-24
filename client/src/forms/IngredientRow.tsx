import { View } from 'react-native';

import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { styles } from '../styles/theme';
import type { IngredientDraft } from './IngredientDraft';

interface IngredientRowProps {
  number: number;
  draft: IngredientDraft;
  canRemove: boolean;
  onChange: (field: 'name' | 'amount' | 'unit', value: string) => void;
  onRemove: () => void;
}

export function IngredientRow({
  number,
  draft,
  canRemove,
  onChange,
  onRemove,
}: IngredientRowProps) {
  return (
    <View style={[styles.rule, styles.stack]}>
      <TextField
        label={'Ingredient ' + number}
        placeholder="e.g. Pasta"
        value={draft.name}
        onChangeText={(value) => onChange('name', value)}
      />

      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            label={'Amount ' + number}
            placeholder="Optional"
            inputMode="decimal"
            value={draft.amount}
            onChangeText={(value) => onChange('amount', value)}
          />
        </View>

        <View style={styles.grow}>
          <TextField
            label={'Unit ' + number}
            placeholder="e.g. g"
            value={draft.unit}
            onChangeText={(value) => onChange('unit', value)}
          />
        </View>

        {canRemove && (
          <Button label={'Remove ingredient ' + number} onPress={onRemove}>
            Remove
          </Button>
        )}
      </View>
    </View>
  );
}
