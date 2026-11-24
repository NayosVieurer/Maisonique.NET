import { useState } from 'react';

import { BodyText } from '../components/BodyText';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import type { Recipe } from '../models/Recipe';
import type { RecipeDraft } from '../models/RecipeDraft';
import { newId } from '../utils/newId';
import { EditorForm } from './EditorForm';
import type { FormProps } from './FormProps';
import { ingredientFromDraft, makeIngredientDraft } from './IngredientDraft';
import { IngredientRow } from './IngredientRow';

interface RecipeFormProps extends FormProps {
  item?: Recipe;
  draft?: RecipeDraft;
}

export function RecipeForm({ item, draft, ...actions }: RecipeFormProps) {
  const initial = item ?? draft;
  const [id] = useState(() => item?.id ?? newId());
  const [title, setTitle] = useState(initial?.title ?? '');
  const [servings, setServings] = useState(String(initial?.servings ?? 4));
  const [steps, setSteps] = useState(initial?.steps.join('\n') ?? '');
  const [ingredients, setIngredients] = useState(
    () => initial?.ingredients.map(makeIngredientDraft) ?? [makeIngredientDraft()],
  );

  function updateIngredient(
    key: string,
    field: 'name' | 'amount' | 'unit',
    value: string,
  ) {
    setIngredients((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  }

  function formData() {
    return {
      title,
      servings: Number(servings),
      ingredients: ingredients.map(ingredientFromDraft),
      steps: steps
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  return (
    <EditorForm
      {...actions}
      title={item ? 'Edit recipe' : 'Add recipe'}
      path={'/recipes/' + id}
      version={item?.version ?? 0}
      data={formData}
    >
      <TextField
        label="Recipe title"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />
      <TextField
        label="Recipe servings"
        inputMode="numeric"
        value={servings}
        onChangeText={setServings}
      />

      <BodyText bold>Ingredients</BodyText>
      {ingredients.map((row, index) => (
        <IngredientRow
          key={row.key}
          number={index + 1}
          draft={row}
          canRemove={ingredients.length > 1}
          onChange={(field, value) => updateIngredient(row.key, field, value)}
          onRemove={() =>
            setIngredients((rows) => rows.filter((item) => item.key !== row.key))
          }
        />
      ))}
      <Button onPress={() => setIngredients((rows) => [...rows, makeIngredientDraft()])}>
        Add ingredient
      </Button>

      <TextField
        label="Method (one step per line)"
        multiline
        value={steps}
        onChangeText={setSteps}
      />
    </EditorForm>
  );
}
