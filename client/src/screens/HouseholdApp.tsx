import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { ErrorNotice } from '../components/ErrorNotice';
import { Heading } from '../components/Heading';
import { RecipeDetails } from '../components/RecipeDetails';
import { WeekNavigation } from '../components/WeekNavigation';
import { FormRouter } from '../forms/FormRouter';
import { useBoard } from '../hooks/useBoard';
import { useHouseholdWrite } from '../hooks/useHouseholdWrite';
import type { Board } from '../models/Board';
import type { Editor } from '../models/Editor';
import { tabTitles, type Tab } from '../models/Tab';
import { colour, styles } from '../styles/theme';
import { addDays } from '../utils/dates';
import { CookbookScreen } from './CookbookScreen';
import { HouseholdScreen } from './HouseholdScreen';
import { PlannerScreen } from './PlannerScreen';
import { ShoppingScreen } from './ShoppingScreen';

function selectedDay(board: Board | null, selection: string | null): string {
  if (!board) {
    return '';
  }

  const lastDay = addDays(board.start, 6);
  if (selection && selection >= board.start && selection <= lastDay) {
    return selection;
  }

  return board.today >= board.start && board.today <= lastDay ? board.today : board.start;
}

export function HouseholdApp() {
  const compact = useWindowDimensions().width < 550;
  const [tab, setTab] = useState<Tab>('Planner');
  const [start, setStart] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [reading, setReading] = useState<string | null>(null);

  const { board, error: readError, refresh } = useBoard(start);
  const { busy, error: writeError, change, clearError } = useHouseholdWrite(refresh);
  const error = writeError || readError;
  const day = selectedDay(board, selection);
  const recipe = board?.recipes.find((item) => item.id === reading);

  function selectTab(next: Tab) {
    setTab(next);
    clearError();
  }

  function moveWeek(offset: number) {
    if (board) {
      setStart(addDays(board.start, offset));
      setSelection(addDays(day, offset));
      clearError();
    }
  }

  function thisWeek() {
    setStart(null);
    setSelection(null);
    clearError();
  }

  function refreshBoard() {
    clearError();
    void refresh();
  }

  function finishEditing() {
    setEditor(null);
    refreshBoard();
  }

  function openRecipeEditor(next: Editor) {
    setReading(null);
    setEditor(next);
  }

  return (
    <SafeAreaView style={screen.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={screen.root}>
        <AppHeader activeTab={tab} today={board?.today} onSelect={selectTab} />

        <ScrollView
          key={tab}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={screen.scroll}
        >
          <View style={[screen.content, { paddingHorizontal: compact ? 12 : 30 }]}>
            <Heading large>{tabTitles[tab]}</Heading>

            {!!error && (
              <View style={styles.stack}>
                <ErrorNotice text={error} />
                <View style={styles.row}>
                  <Button onPress={refreshBoard}>Refresh</Button>
                </View>
              </View>
            )}

            {!board && !readError && (
              <ActivityIndicator
                accessibilityLabel="Loading household"
                color={colour.green}
              />
            )}

            {board && (
              <>
                {(tab === 'Planner' || tab === 'Shopping') && (
                  <WeekNavigation start={board.start} move={moveWeek} today={thisWeek} />
                )}

                {tab === 'Planner' && (
                  <PlannerScreen
                    board={board}
                    day={day}
                    selectDay={setSelection}
                    edit={setEditor}
                    busy={busy}
                    toggle={(id, done) =>
                      void change('PATCH', '/entries/' + id + '/done', { done })
                    }
                  />
                )}

                {tab === 'Recipes' && (
                  <CookbookScreen board={board} edit={setEditor} read={setReading} />
                )}

                {tab === 'Shopping' && (
                  <ShoppingScreen
                    key={board.start}
                    board={board}
                    change={change}
                    busy={busy}
                  />
                )}

                {tab === 'Household' && (
                  <HouseholdScreen board={board} edit={setEditor} />
                )}
              </>
            )}
          </View>
        </ScrollView>

        {editor && board && (
          <FormRouter
            editor={editor}
            board={board}
            close={() => setEditor(null)}
            saved={finishEditing}
          />
        )}

        {recipe && !editor && (
          <RecipeDetails
            recipe={recipe}
            close={() => setReading(null)}
            edit={() => openRecipeEditor({ type: 'recipe', item: recipe })}
            plan={() => openRecipeEditor({ type: 'meal', day, recipe })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const screen = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colour.green },
  root: { flex: 1, backgroundColor: colour.paper },
  scroll: { alignItems: 'center', paddingBottom: 40 },
  content: { width: '100%', maxWidth: 1180, paddingTop: 21, gap: 15 },
});
