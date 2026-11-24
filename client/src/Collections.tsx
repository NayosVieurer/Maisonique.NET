import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { newId } from './api';
import { readRecipe } from './importRecipe';
import { type Board, type Editor, type Recipe } from './types';
import { Body, Box, Btn, Check, Dialog, Field, Heading, Notice, colour, s } from './ui';

export function Cookbook({ board, edit, read }: { board: Board; edit: (e: Editor) => void; read: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [paste, setPaste] = useState<string | null>(null);
  const [parseError, setParseError] = useState('');
  const { width } = useWindowDimensions();
  const match = board.recipes.filter(r => r.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={s.stack}><View style={s.row}><View style={{ flexGrow: 1, maxWidth: 460 }}>
    <Field label="Find a recipe" value={query} onChangeText={setQuery} placeholder="Search by title" /></View>
    <View style={[s.row, { alignSelf: 'flex-end' }]}><Btn tone="primary" onPress={() => edit({ type: 'recipe' })}>Add recipe</Btn>
      <Btn onPress={() => { setPaste(''); setParseError(''); }}>Paste recipe</Btn></View></View>
    <View style={[s.row, { alignItems: 'stretch' }]}>{match.map(r =>
      <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={'Open ' + r.title}
        onPress={() => read(r.id)} style={({ pressed }) => [s.card, { width: width >= 800 ? '48%' : '100%', gap: 9,
          borderTopWidth: 4, borderTopColor: colour.green, backgroundColor: pressed ? colour.sage : colour.card }]}>
        <Heading>{r.title}</Heading><Body small>Serves {r.servings} · {r.ingredients.length} ingredients</Body>
        <Body small>{r.ingredients.slice(0, 4).map(i => i.name).join(', ')}</Body>
      </Pressable>)}</View>
    {!match.length && <Body>{query ? 'No recipes match this search.' : 'Your cookbook is empty. Add your first recipe.'}</Body>}
    {paste !== null && <Dialog title="Paste a recipe" close={() => setPaste(null)}>
      <Body>Include the title, ingredients and method. You can review the quantities before saving.</Body>
      <Field label="Recipe text" multiline maxLength={50000} value={paste} onChangeText={setPaste}
        style={{ minHeight: 185 }} placeholder={'Lemon pasta\nServes 2\nIngredients\n160 g pasta\n1 lemon\nMethod\nCook the pasta and toss with lemon.'} />
      {!!parseError && <Notice text={parseError} />}
      <Btn tone="primary" disabled={!paste.trim()} onPress={() => {
        try { const draft = readRecipe(paste); setPaste(null); edit({ type: 'recipe', draft }); }
        catch (e) { setParseError(e instanceof Error ? e.message : 'Check the recipe headings.'); }
      }}>Review recipe</Btn>
    </Dialog>}
  </View>;
}
export function RecipeDetail({ recipe, close, edit, plan }: { recipe: Recipe; close: () => void; edit: () => void; plan: () => void }) {
  return <Dialog title={recipe.title} close={close}>
    <Body small>Serves {recipe.servings}</Body>
    <View style={s.row}><Btn tone="primary" onPress={plan}>Plan this recipe</Btn><Btn onPress={edit}>Edit recipe</Btn></View>
    <Box><Heading>Ingredients</Heading>{recipe.ingredients.map((i, index) =>
      <Body key={index}>{[i.amount, i.unit, i.name].filter(x => x !== null && x !== '').join(' ')}</Body>)}</Box>
    <Box><Heading>Method</Heading>{recipe.steps.map((step, i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
      <Body bold>{i + 1}.</Body><Body style={s.grow}>{step}</Body></View>)}</Box>
  </Dialog>;
}
type Change = (method: string, path: string, body?: unknown) => Promise<boolean>;
export function Shopping({ board, change, busy }: { board: Board; change: Change; busy: boolean }) {
  const [extra, setExtra] = useState('');
  const [id, setId] = useState(newId);
  const [remove, setRemove] = useState<string | null>(null);
  const path = '/shopping/' + board.start;
  async function add() {
    if (await change('PUT', path + '/extras/' + id, { label: extra })) { setExtra(''); setId(newId()); }
  }
  return <View style={s.stack}>
    <Box><View style={{ gap: 10, flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={s.grow}><Field label="Extra shopping item" placeholder="e.g. Washing-up liquid" value={extra}
        editable={!busy} onChangeText={setExtra} maxLength={120} onSubmitEditing={() => { if (extra.trim()) void add(); }} /></View>
      <Btn tone="primary" disabled={busy || !extra.trim()} onPress={() => void add()}>Add item</Btn>
    </View></Box>
    {[false, true].map(done => {
      const items = board.shopping.filter(i => i.done === done);
      if (done && !items.length) return null;
      return <Box key={String(done)}><View style={s.between}><Heading>{done ? 'Bought' : 'To buy'}</Heading><Body small>{items.length} {items.length === 1 ? 'item' : 'items'}</Body></View>
        {!items.length && <Body small>{board.shopping.length ? 'Everything on this list is checked off.' : 'Plan a meal to list its ingredients, or add an extra item above.'}</Body>}
        {items.map(i => <View key={i.id} style={[s.rule, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
          <Check label={i.label} checked={i.done} disabled={busy} detail={i.manual ? 'Extra item'
            : [i.amount, i.unit].filter(v => v !== null && v !== '').join(' ') || 'As needed'}
            onPress={() => void change('PATCH', path + '/' + i.id + '/done', { done: !i.done })} />
          {i.manual && <Btn label={'Remove ' + i.label} disabled={busy} onPress={() => setRemove(i.id)}>Remove</Btn>}
        </View>)}</Box>;
    })}
    {remove && <Dialog title="Remove extra item?" close={() => setRemove(null)} busy={busy}>
      <Body>{board.shopping.find(i => i.id === remove)?.label}</Body>
      <Btn tone="danger" disabled={busy} onPress={async () => { if (await change('DELETE', path + '/extras/' + remove)) setRemove(null); }}>Confirm removal</Btn>
    </Dialog>}
  </View>;
}
export function Household({ board, edit }: { board: Board; edit: (e: Editor) => void }) {
  return <Box><View style={s.between}><Heading>People</Heading><Btn tone="primary" onPress={() => edit({ type: 'person' })}>Add person</Btn></View>
    {!board.people.length && <Body small>Add a name and colour to assign events and chores to someone.</Body>}
    {board.people.map(person => <View key={person.id} style={[s.between, s.rule]}><View style={s.row}>
      <View style={[s.dot, { backgroundColor: person.colour }]} /><Body bold>{person.name}</Body></View>
      <Btn label={'Edit ' + person.name} onPress={() => edit({ type: 'person', item: person })}>Edit</Btn></View>)}
    <Body small>Household time zone · {board.timeZone}</Body>
  </Box>;
}
