import type { ReactNode } from 'react';
import { Platform, View, ScrollView, KeyboardAvoidingView, Modal } from 'react-native';

import { colour, styles } from '../styles/theme';
import { Button } from './Button';
import { Heading } from './Heading';

type DialogProps = {
  title: string;
  children: ReactNode;
  close: () => void;
  busy?: boolean;
};

export function Dialog({ title, children, close, busy = false }: DialogProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) {
          close();
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(20,40,31,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 640,
            maxHeight: '93%',
            backgroundColor: colour.paper,
            borderRadius: 18,
            padding: 16,
            gap: 8,
            flexShrink: 1,
          }}
        >
          <View style={styles.between}>
            <Heading>{title}</Heading>
            <Button disabled={busy} onPress={close}>
              Close
            </Button>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ gap: 14, padding: 2 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
