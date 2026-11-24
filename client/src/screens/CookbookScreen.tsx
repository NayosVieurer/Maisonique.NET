import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { BodyText } from '../components/BodyText';
import { Button } from '../components/Button';
import { Heading } from '../components/Heading';
import { PasteRecipeDialog } from '../components/PasteRecipeDialog';
import { TextField } from '../components/TextField';
import type { Board } from '../models/Board';
import type { Editor } from '../models/Editor';
import type { RecipeDraft } from '../models/RecipeDraft';
import { colour, styles } from '../styles/theme';

interface CookbookScreenProps {
  board: Board;
  edit: (editor: Editor) => void;
  read: (id: string) => void;
}

export function CookbookScreen({ board, edit, read }: CookbookScreenProps) {
  const [query, setQuery] = useState('');
  const [pasting, setPasting] = useState(false);
  const wide = useWindowDimensions().width >= 800;

  const search = query.trim().toLowerCase();
  const recipes = board.recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search),
  );

  function reviewDraft(draft: RecipeDraft) {
    setPasting(false);
    edit({ type: 'recipe', draft });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <View style={{ flexGrow: 1, maxWidth: 460 }}>
          <TextField
            label="Find a recipe"
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title"
          />
        </View>

        <View style={[styles.row, { alignSelf: 'flex-end' }]}>
          <Button tone="primary" onPress={() => edit({ type: 'recipe' })}>
            Add recipe
          </Button>
          <Button onPress={() => setPasting(true)}>Paste recipe</Button>
        </View>
      </View>

      <View style={[styles.row, { alignItems: 'stretch' }]}>
        {recipes.map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityRole="button"
            accessibilityLabel={'Open ' + recipe.title}
            onPress={() => read(recipe.id)}
            style={({ pressed }) => [
              styles.card,
              {
                width: wide ? '48%' : '100%',
                gap: 9,
                borderTopWidth: 4,
                borderTopColor: colour.green,
                backgroundColor: pressed ? colour.sage : colour.card,
              },
            ]}
          >
            <Heading>{recipe.title}</Heading>
            <BodyText small>
              Serves {recipe.servings} · {recipe.ingredients.length} ingredients
            </BodyText>
            <BodyText small>
              {recipe.ingredients
                .slice(0, 4)
                .map((ingredient) => ingredient.name)
                .join(', ')}
            </BodyText>
          </Pressable>
        ))}
      </View>

      {!recipes.length && (
        <BodyText>
          {query
            ? 'No recipes match this search.'
            : 'Your cookbook is empty. Add your first recipe.'}
        </BodyText>
      )}

      {pasting && (
        <PasteRecipeDialog onClose={() => setPasting(false)} onReview={reviewDraft} />
      )}
    </View>
  );
}
