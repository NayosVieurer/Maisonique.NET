import { View } from 'react-native';

import type { Recipe } from '../models/Recipe';
import { styles } from '../styles/theme';
import { BodyText } from './BodyText';
import { Button } from './Button';
import { Card } from './Card';
import { Dialog } from './Dialog';
import { Heading } from './Heading';

type RecipeDetailsProps = {
  recipe: Recipe;
  close: () => void;
  edit: () => void;
  plan: () => void;
};

export function RecipeDetails({ recipe, close, edit, plan }: RecipeDetailsProps) {
  return (
    <Dialog title={recipe.title} close={close}>
      <BodyText small>Serves {recipe.servings}</BodyText>
      <View style={styles.row}>
        <Button tone="primary" onPress={plan}>
          Plan this recipe
        </Button>
        <Button onPress={edit}>Edit recipe</Button>
      </View>
      <Card>
        <Heading>Ingredients</Heading>
        {recipe.ingredients.map((ingredient, index) => (
          <BodyText key={index}>
            {[ingredient.amount, ingredient.unit, ingredient.name]
              .filter((x) => x !== null && x !== '')
              .join(' ')}
          </BodyText>
        ))}
      </Card>
      <Card>
        <Heading>Method</Heading>
        {recipe.steps.map((step, index) => (
          <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
            <BodyText bold>{index + 1}.</BodyText>
            <BodyText style={styles.grow}>{step}</BodyText>
          </View>
        ))}
      </Card>
    </Dialog>
  );
}
