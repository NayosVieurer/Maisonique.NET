import { useState } from 'react';

import type { RecipeDraft } from '../models/RecipeDraft';
import { readRecipe } from '../services/parseRecipe';
import { BodyText } from './BodyText';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { ErrorNotice } from './ErrorNotice';
import { TextField } from './TextField';

interface PasteRecipeDialogProps {
  onClose: () => void;
  onReview: (draft: RecipeDraft) => void;
}

const example = [
  'Lemon pasta',
  'Serves 2',
  'Ingredients',
  '160 g pasta',
  '1 lemon',
  'Method',
  'Cook the pasta and toss with lemon.',
].join('\n');

export function PasteRecipeDialog({ onClose, onReview }: PasteRecipeDialogProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function review() {
    try {
      onReview(readRecipe(text));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Check the recipe headings.');
    }
  }

  return (
    <Dialog title="Paste a recipe" close={onClose}>
      <BodyText>
        Include the title, ingredients and method. You can review the quantities before
        saving.
      </BodyText>

      <TextField
        label="Recipe text"
        multiline
        maxLength={50000}
        value={text}
        onChangeText={setText}
        style={{ minHeight: 185 }}
        placeholder={example}
      />

      {!!error && <ErrorNotice text={error} />}

      <Button tone="primary" disabled={!text.trim()} onPress={review}>
        Review recipe
      </Button>
    </Dialog>
  );
}
