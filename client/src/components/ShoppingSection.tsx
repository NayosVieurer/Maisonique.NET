import { View } from 'react-native';

import type { ShoppingItem } from '../models/ShoppingItem';
import { styles } from '../styles/theme';
import { BodyText } from './BodyText';
import { Button } from './Button';
import { Card } from './Card';
import { CheckItem } from './CheckItem';
import { Heading } from './Heading';

interface ShoppingSectionProps {
  title: string;
  items: ShoppingItem[];
  emptyMessage?: string;
  busy: boolean;
  onToggle: (item: ShoppingItem) => void;
  onRemove: (id: string) => void;
}

function itemDetail(item: ShoppingItem): string {
  if (item.manual) {
    return 'Extra item';
  }

  const quantity = [item.amount, item.unit]
    .filter((value) => value !== null && value !== '')
    .join(' ');
  return quantity || 'As needed';
}

export function ShoppingSection({
  title,
  items,
  emptyMessage,
  busy,
  onToggle,
  onRemove,
}: ShoppingSectionProps) {
  return (
    <Card>
      <View style={styles.between}>
        <Heading>{title}</Heading>
        <BodyText small>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </BodyText>
      </View>

      {items.length === 0 && emptyMessage && <BodyText small>{emptyMessage}</BodyText>}

      {items.map((item) => (
        <View
          key={item.id}
          style={[styles.rule, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
        >
          <CheckItem
            label={item.label}
            checked={item.done}
            disabled={busy}
            detail={itemDetail(item)}
            onPress={() => onToggle(item)}
          />

          {item.manual && (
            <Button
              label={'Remove ' + item.label}
              disabled={busy}
              onPress={() => onRemove(item.id)}
            >
              Remove
            </Button>
          )}
        </View>
      ))}
    </Card>
  );
}
