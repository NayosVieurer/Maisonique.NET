import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { message, newId, request } from './api';
import type { RecipeDraft } from './importRecipe';
import { type Board, type Editor, type Entry, type Ingredient, type Kind, type Meal, type Person, type Recipe, slots, type Slot } from './types';
import { Body, Btn, Choice, Dialog, Field, Notice, palette, s } from './ui';

type FormProps = { close: () => void; saved: () => void };
type FrameProps = FormProps & {
  title: string; path: string; version: number; data: () => object; children: ReactNode;
};
function Frame({ title, path, data, version, close, saved, children }: FrameProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const inFlight = useRef(false);
  async function submit(remove: boolean) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (remove) await request('DELETE', path + '?version=' + version);
      else await request('PUT', path, { ...data(), version });
      saved();
    } catch (e) { setError(message(e)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Dialog title={title} close={close} busy={busy}>
    {children}
    {!!error && <Notice text={error} />}
    {confirm ? <View style={s.stack}><Body>Remove this item?</Body><View style={s.row}>
      <Btn disabled={busy} tone="danger" onPress={() => void submit(true)}>Confirm removal</Btn>
      <Btn disabled={busy} onPress={() => setConfirm(false)}>Keep item</Btn></View></View>
      : <View style={s.between}><Btn disabled={busy} tone="primary" onPress={() => void submit(false)}>{busy ? 'Saving…' : 'Save'}</Btn>
        {version > 0 && <Btn disabled={busy} tone="danger" onPress={() => setConfirm(true)}>Remove</Btn>}</View>}
  </Dialog>;
}
function PersonForm({ item, ...actions }: FormProps & { item?: Person }) {
  const [id] = useState(() => item?.id ?? newId());
  const [name, setName] = useState(item?.name ?? '');
  const [colour, setColour] = useState(item?.colour ?? palette[0].value);
  return <Frame {...actions} title={item ? 'Edit person' : 'Add person'} path={'/people/' + id}
    version={item?.version ?? 0} data={() => ({ name, colour })}>
    <Field label="Name" value={name} onChangeText={setName} maxLength={60} />
    <Body small bold>Calendar colour</Body><View style={s.row}>{palette.map(p =>
      <Choice key={p.value} title={p.name} dot={p.value} active={colour === p.value} onPress={() => setColour(p.value)} />)}</View>
  </Frame>;
}
function EntryForm({ board, day: initialDay, item, ...actions }: FormProps & { board: Board; day: string; item?: Entry }) {
  const [id] = useState(() => item?.id ?? newId());
  const [day, setDay] = useState(item?.day ?? initialDay);
  const [kind, setKind] = useState<Kind>(item?.kind ?? 'event');
  const [title, setTitle] = useState(item?.title ?? '');
  const [personId, setPerson] = useState<string | null>(item?.personId ?? null);
  const [start, setStart] = useState(item?.startTime ?? '');
  const [end, setEnd] = useState(item?.endTime ?? '');
  return <Frame {...actions} title={item ? 'Edit calendar item' : 'Add to calendar'} path={'/entries/' + id}
    version={item?.version ?? 0} data={() => ({ day, kind, title, personId, startTime: start.trim() || null, endTime: end.trim() || null })}>
    <View style={s.row}>{(['event','chore'] as const).map(k => <Choice key={k}
      title={k === 'event' ? 'Event' : 'Chore'} active={kind === k} onPress={() => setKind(k)} />)}</View>
    <Field label="Title" value={title} onChangeText={setTitle} maxLength={140} />
    <Field label="Date" placeholder="YYYY-MM-DD" value={day} onChangeText={setDay} />
    <View style={s.row}><View style={s.grow}><Field label="Start time" placeholder="HH:MM" value={start} onChangeText={setStart} /></View>
      <View style={s.grow}><Field label="End time" placeholder="HH:MM" value={end} onChangeText={setEnd} /></View></View>
    <Body small>Leave both times blank for an all-day item.</Body>
    <Body small bold>Assigned to</Body><View style={s.row}>
      <Choice title="Everyone" active={personId === null} onPress={() => setPerson(null)} />
      {board.people.map(p => <Choice key={p.id} title={p.name} dot={p.colour} active={personId === p.id} onPress={() => setPerson(p.id)} />)}
    </View>
  </Frame>;
}
function MealForm({ board, day: initialDay, item, recipe, ...actions }: FormProps & { board: Board; day: string; item?: Meal; recipe?: Recipe }) {
  const [id] = useState(() => item?.id ?? newId());
  const [day, setDay] = useState(item?.day ?? initialDay);
  const [slot, setSlot] = useState<Slot>(item?.slot ?? 'Dinner');
  const [recipeId, setRecipe] = useState(item?.recipeId ?? recipe?.id ?? board.recipes[0]?.id ?? '');
  const [servings, setServings] = useState(String(item?.servings ?? board.recipes.find(r => r.id === recipeId)?.servings ?? 4));
  return <Frame {...actions} title={item ? 'Edit planned meal' : 'Plan a meal'} path={'/meals/' + id}
    version={item?.version ?? 0} data={() => ({ day, slot, recipeId, servings: Number(servings) })}>
    <Field label="Date" placeholder="YYYY-MM-DD" value={day} onChangeText={setDay} />
    <Body small bold>Meal</Body><View style={s.row}>{slots.map(v => <Choice key={v} title={v} active={slot === v} onPress={() => setSlot(v)} />)}</View>
    <Body small bold>Recipe</Body><View style={s.row}>{board.recipes.map(r =>
      <Choice key={r.id} title={r.title} active={r.id === recipeId} onPress={() => { setRecipe(r.id); setServings(String(r.servings)); }} />)}</View>
    <Field label="Planned servings" inputMode="numeric" value={servings} onChangeText={setServings} />
  </Frame>;
}
type IngredientDraft = { key: string; name: string; amount: string; unit: string };
function ingredientDraft(i?: Ingredient): IngredientDraft {
  return { key: newId(), name: i?.name ?? '', amount: i?.amount?.toString() ?? '', unit: i?.unit ?? '' };
}
function RecipeForm({ item, draft, ...actions }: FormProps & { item?: Recipe; draft?: RecipeDraft }) {
  const initial = item ?? draft;
  const [id] = useState(() => item?.id ?? newId());
  const [title, setTitle] = useState(initial?.title ?? '');
  const [servings, setServings] = useState(String(initial?.servings ?? 4));
  const [drafts, setDrafts] = useState<IngredientDraft[]>(() => initial?.ingredients.map(ingredientDraft) ?? [ingredientDraft()]);
  const [steps, setSteps] = useState(initial?.steps.join('\n') ?? '');
  function change(key: string, field: 'name' | 'amount' | 'unit', text: string) {
    setDrafts(items => items.map(d => d.key === key ? { ...d, [field]: text } : d));
  }
  function data() {
    const ingredients = drafts.map(d => {
      const raw = d.amount.trim();
      if (raw && !/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw))
        throw new Error('Use a decimal such as 0.5 for an ingredient amount, or leave it blank.');
      return { name: d.name, amount: raw ? Number(raw) : null, unit: d.unit };
    });
    return { title, servings: Number(servings), ingredients, steps: steps.split('\n').map(v => v.trim()).filter(Boolean) };
  }
  return <Frame {...actions} title={item ? 'Edit recipe' : 'Add recipe'} path={'/recipes/' + id}
    version={item?.version ?? 0} data={data}>
    <Field label="Recipe title" value={title} onChangeText={setTitle} maxLength={120} />
    <Field label="Recipe servings" inputMode="numeric" value={servings} onChangeText={setServings} />
    <Body bold>Ingredients</Body>
    {drafts.map((d, i) => <View key={d.key} style={[s.rule, s.stack]}>
      <Field label={'Ingredient ' + (i + 1)} placeholder="e.g. Pasta" value={d.name} onChangeText={v => change(d.key, 'name', v)} />
      <View style={s.row}><View style={s.grow}><Field label={'Amount ' + (i + 1)} placeholder="Optional"
        inputMode="decimal" value={d.amount} onChangeText={v => change(d.key, 'amount', v)} /></View>
        <View style={s.grow}><Field label={'Unit ' + (i + 1)} placeholder="e.g. g" value={d.unit} onChangeText={v => change(d.key, 'unit', v)} /></View>
        {drafts.length > 1 && <Btn label={'Remove ingredient ' + (i + 1)}
          onPress={() => setDrafts(items => items.filter(row => row.key !== d.key))}>Remove</Btn>}</View>
    </View>)}
    <Btn onPress={() => setDrafts(items => [...items, ingredientDraft()])}>Add ingredient</Btn>
    <Field label="Method (one step per line)" multiline value={steps} onChangeText={setSteps} />
  </Frame>;
}
export function Editors({ editor, board, ...actions }: FormProps & { editor: Editor; board: Board }) {
  switch (editor.type) {
    case 'person': return <PersonForm item={editor.item} {...actions} />;
    case 'entry': return <EntryForm board={board} day={editor.day} item={editor.item} {...actions} />;
    case 'meal': return <MealForm board={board} day={editor.day} item={editor.item} recipe={editor.recipe} {...actions} />;
    case 'recipe': return <RecipeForm item={editor.item} draft={editor.draft} {...actions} />;
  }
}
