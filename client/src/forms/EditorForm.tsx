import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { BodyText } from '../components/BodyText';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { ErrorNotice } from '../components/ErrorNotice';
import { apiRequest } from '../services/apiRequest';
import { styles } from '../styles/theme';
import { errorMessage } from '../utils/errorMessage';
import type { FormProps } from './FormProps';

interface EditorFormProps extends FormProps {
  title: string;
  path: string;
  version: number;
  data: () => object;
  children: ReactNode;
}

export function EditorForm({
  title,
  path,
  data,
  version,
  close,
  saved,
  children,
}: EditorFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const inFlight = useRef(false);

  async function submit(action: 'save' | 'remove') {
    if (inFlight.current) {
      return;
    }

    inFlight.current = true;
    setBusy(true);
    setError('');

    try {
      if (action === 'remove') {
        await apiRequest('DELETE', path + '?version=' + version);
      } else {
        await apiRequest('PUT', path, { ...data(), version });
      }

      saved();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title={title} close={close} busy={busy}>
      {children}

      {!!error && <ErrorNotice text={error} />}

      {confirmingRemoval ? (
        <View style={styles.stack}>
          <BodyText>Remove this item?</BodyText>
          <View style={styles.row}>
            <Button disabled={busy} tone="danger" onPress={() => void submit('remove')}>
              Confirm removal
            </Button>
            <Button disabled={busy} onPress={() => setConfirmingRemoval(false)}>
              Keep item
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.between}>
          <Button disabled={busy} tone="primary" onPress={() => void submit('save')}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
          {version > 0 && (
            <Button
              disabled={busy}
              tone="danger"
              onPress={() => setConfirmingRemoval(true)}
            >
              Remove
            </Button>
          )}
        </View>
      )}
    </Dialog>
  );
}
