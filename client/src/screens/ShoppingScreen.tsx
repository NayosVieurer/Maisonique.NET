import { useState } from 'react';
import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Dialog } from '../components/Dialog';
import { ShoppingSection } from '../components/ShoppingSection';
import { TextField } from '../components/TextField';
import type { Board } from '../models/Board';
import type { ShoppingItem } from '../models/ShoppingItem';
import type { Change } from '../services/Change';
import { styles } from '../styles/theme';
import { newId } from '../utils/newId';

interface ShoppingScreenProps {
  board: Board;
  change: Change;
  busy: boolean;
}

export function ShoppingScreen({ board, change, busy }: ShoppingScreenProps) {
  const [extra, setExtra] = useState('');
  const [extraId, setExtraId] = useState(newId);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const basePath = '/shopping/' + board.start;
  const toBuy = board.shopping.filter((item) => !item.done);
  const bought = board.shopping.filter((item) => item.done);
  const emptyMessage = bought.length
    ? 'Everything on this list is checked off.'
    : 'Plan a meal to list its ingredients, or add an extra item above.';

  async function addExtra() {
    if (!extra.trim()) {
      return;
    }

    const saved = await change('PUT', basePath + '/extras/' + extraId, { label: extra });
    if (saved) {
      setExtra('');
      setExtraId(newId());
    }
  }

  async function removeExtra() {
    if (!removingId) {
      return;
    }

    if (await change('DELETE', basePath + '/extras/' + removingId)) {
      setRemovingId(null);
    }
  }

  function toggle(item: ShoppingItem) {
    void change('PATCH', basePath + '/' + item.id + '/done', { done: !item.done });
  }

  return (
    <View style={styles.stack}>
      <Card>
        <View style={{ gap: 10, flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={styles.grow}>
            <TextField
              label="Extra shopping item"
              placeholder="e.g. Washing-up liquid"
              value={extra}
              editable={!busy}
              onChangeText={setExtra}
              maxLength={120}
              onSubmitEditing={addExtra}
            />
          </View>

          <Button tone="primary" disabled={busy || !extra.trim()} onPress={addExtra}>
            Add item
          </Button>
        </View>
      </Card>

      <ShoppingSection
        title="To buy"
        items={toBuy}
        emptyMessage={emptyMessage}
        busy={busy}
        onToggle={toggle}
        onRemove={setRemovingId}
      />

      {bought.length > 0 && (
        <ShoppingSection
          title="Bought"
          items={bought}
          busy={busy}
          onToggle={toggle}
          onRemove={setRemovingId}
        />
      )}

      {removingId && (
        <Dialog title="Remove extra item?" close={() => setRemovingId(null)} busy={busy}>
          <BodyText>
            {board.shopping.find((item) => item.id === removingId)?.label}
          </BodyText>
          <Button tone="danger" disabled={busy} onPress={removeExtra}>
            Confirm removal
          </Button>
        </Dialog>
      )}
    </View>
  );
}
