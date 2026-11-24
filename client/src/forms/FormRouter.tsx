import type { Board } from '../models/Board';
import type { Editor } from '../models/Editor';
import { EntryForm } from './EntryForm';
import type { FormProps } from './FormProps';
import { MealForm } from './MealForm';
import { PersonForm } from './PersonForm';
import { RecipeForm } from './RecipeForm';

type FormRouterProps = FormProps & {
  editor: Editor;
  board: Board;
};

export function FormRouter({ editor, board, ...actions }: FormRouterProps) {
  switch (editor.type) {
    case 'person':
      return <PersonForm item={editor.item} {...actions} />;
    case 'entry':
      return <EntryForm board={board} day={editor.day} item={editor.item} {...actions} />;
    case 'meal':
      return (
        <MealForm
          board={board}
          day={editor.day}
          item={editor.item}
          recipe={editor.recipe}
          {...actions}
        />
      );
    case 'recipe':
      return <RecipeForm item={editor.item} draft={editor.draft} {...actions} />;
  }
}
