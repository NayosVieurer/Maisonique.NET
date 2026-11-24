import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSerifText_400Regular } from '@expo-google-fonts/dm-serif-text/400Regular';
import { message, request, useBoard } from './api';
import { addDays, displayDay } from './dates';
import { Cookbook, Household, RecipeDetail, Shopping } from './Collections';
import { Editors } from './Editors';
import { Planner, WeekNav } from './Planner';
import type { Editor } from './types';
import { Body, Btn, Heading, Notice, colour, fonts, s } from './ui';

const tabs = ['Planner', 'Recipes', 'Shopping', 'Household'] as const;
type Tab = typeof tabs[number];
const titles: Record<Tab, string> = { Planner: 'Week planner', Recipes: 'Cookbook', Shopping: 'Shopping list', Household: 'Household' };

function Kitchen() {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>('Planner');
  const [start, setWeek] = useState<string | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const [writeError, setWriteError] = useState('');
  const { board, error, refresh } = useBoard(start);
  const lastDay = board ? addDays(board.start, 6) : '';
  function inWeek(date: string | null) { return !!board && !!date && date >= board.start && date <= lastDay; }
  const day = inWeek(selection) ? selection! : inWeek(board?.today ?? null) ? board!.today : board?.start ?? '';
  const recipe = board?.recipes.find(r => r.id === reading);
  function changeTab(next: Tab) { setTab(next); setWriteError(''); }
  function move(days: number) {
    if (!board) return;
    setWeek(addDays(board.start, days)); setSelection(addDays(day, days)); setWriteError('');
  }
  async function change(method: string, path: string, body?: unknown) {
    if (writing.current) return false;
    writing.current = true; setBusy(true); setWriteError('');
    try { await request(method, path, body); await refresh(); return true; }
    catch (e) { setWriteError(message(e)); return false; }
    finally { writing.current = false; setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: colour.green }}>
    <StatusBar barStyle="light-content" />
    <View style={{ flex: 1, backgroundColor: colour.paper }}>
      <View style={{ backgroundColor: colour.green, paddingHorizontal: width < 550 ? 15 : 30 }}>
        <View style={[s.between, { width: '100%', maxWidth: 1120, alignSelf: 'center', minHeight: 62, flexWrap: 'nowrap' }]}>
          <View style={[s.row, { flexWrap: 'nowrap', gap: 11 }]}>
            <View style={{ width: 23, height: 23, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              {['#DCE9BC','#DCE9BC','#EFAE88','#DCE9BC'].map((c, i) =>
                <View key={i} style={{ width: 10, height: 10, borderRadius: i === 2 ? 5 : 2, backgroundColor: c }} />)}
            </View>
            <Text style={{ fontFamily: fonts.title, fontSize: 25, color: '#FFF' }}>Kitchen Table</Text>
          </View>
          {board && <Body small style={{ color: '#EFF4E4' }}>{displayDay(board.today, { weekday: 'short', day: 'numeric', month: 'short' })}</Body>}
        </View>
      </View>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colour.line, backgroundColor: colour.card }}>
        <View accessibilityRole="tablist" accessibilityLabel="Main navigation" style={{ flexDirection: 'row', gap: width < 550 ? 0 : 10, paddingHorizontal: width < 550 ? 6 : 24,
          width: '100%', maxWidth: 1180, alignSelf: 'center' }}>{tabs.map(t =>
          <Pressable key={t} accessibilityRole="tab" accessibilityLabel={t} aria-selected={t === tab} accessibilityState={{ selected: t === tab }}
            onPress={() => changeTab(t)} style={{ paddingHorizontal: width < 550 ? 4 : 16, minHeight: 49,
              flex: width < 550 ? 1 : undefined, alignItems: 'center', justifyContent: 'center',
              borderBottomWidth: 3, borderBottomColor: t === tab ? colour.green : 'transparent' }}>
            <Body small bold={t === tab} style={{ color: t === tab ? colour.green : colour.mute }}>{t}</Body>
          </Pressable>)}</View>
      </View>
      <ScrollView key={tab} keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
        <View style={{ width: '100%', maxWidth: 1180, paddingHorizontal: width < 550 ? 12 : 30, paddingTop: 21, gap: 15 }}>
          <Heading large>{titles[tab]}</Heading>
          {(error || writeError) ? <View style={s.stack}><Notice text={writeError || error} />
            <View style={s.row}><Btn onPress={() => { setWriteError(''); void refresh(); }}>Refresh</Btn></View></View> : null}
          {!board && !error && <ActivityIndicator accessibilityLabel="Loading household" color={colour.green} />}
          {board && <>
            {(tab === 'Planner' || tab === 'Shopping') && <WeekNav start={board.start} move={move}
              today={() => { setWeek(null); setSelection(null); setWriteError(''); }} />}
            {tab === 'Planner' && <Planner board={board} day={day} selectDay={setSelection} edit={setEditor} busy={busy}
              toggle={(id, done) => void change('PATCH', '/entries/' + id + '/done', { done })} />}
            {tab === 'Recipes' && <Cookbook board={board} edit={setEditor} read={setReading} />}
            {tab === 'Shopping' && <Shopping key={board.start} board={board} change={change} busy={busy} />}
            {tab === 'Household' && <Household board={board} edit={setEditor} />}
          </>}
        </View>
      </ScrollView>
      {editor && board && <Editors editor={editor} board={board} close={() => setEditor(null)}
        saved={() => { setEditor(null); setWriteError(''); void refresh(); }} />}
      {recipe && !editor && <RecipeDetail recipe={recipe} close={() => setReading(null)}
        edit={() => { setReading(null); setEditor({ type: 'recipe', item: recipe }); }}
        plan={() => { setReading(null); setEditor({ type: 'meal', day, recipe }); }} />}
    </View>
  </SafeAreaView>;
}
export default function App() {
  const [ready, error] = useFonts({ DMSans_400Regular, DMSans_600SemiBold, DMSerifText_400Regular });
  return <SafeAreaProvider>{ready || error ? <Kitchen /> : <ActivityIndicator accessibilityLabel="Loading Kitchen Table" color={colour.green} />}</SafeAreaProvider>;
}
