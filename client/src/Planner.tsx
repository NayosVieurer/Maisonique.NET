import { Pressable, View, useWindowDimensions } from 'react-native';
import { addDays, displayDay, weekLabel } from './dates';
import { type Board, type Editor } from './types';
import { Body, Box, Btn, Check, Heading, colour, fonts, s } from './ui';

export function WeekNav({ start, move, today }: { start: string; move: (days: number) => void; today: () => void }) {
  return <View style={[s.between, { gap: 8 }]}>
    <Body bold>{weekLabel(start)}</Body><View style={[s.row, { gap: 4 }]}>
      <Btn onPress={() => move(-7)} label="Previous week">‹</Btn>
      <Btn onPress={today}>This week</Btn><Btn onPress={() => move(7)} label="Next week">›</Btn>
    </View>
  </View>;
}
export function Planner({ board, day, selectDay, edit, toggle, busy }: {
  board: Board; day: string; selectDay: (day: string) => void; edit: (editor: Editor) => void;
  toggle: (id: string, done: boolean) => void; busy: boolean;
}) {
  const { width } = useWindowDimensions();
  const days = Array.from({ length: 7 }, (_, i) => addDays(board.start, i));
  const dayEntries = board.entries.filter(entry => entry.day === day);
  const selectedMeals = board.meals.filter(meal => meal.day === day);
  const recipes = new Map(board.recipes.map(recipe => [recipe.id, recipe]));
  const isWide = width >= 800;
  return <View style={s.stack}>
    <View accessibilityRole="tablist" accessibilityLabel="Days of the week" style={{ flexDirection: 'row', gap: width < 500 ? 2 : 7, padding: 4, borderRadius: 14,
      backgroundColor: colour.cream, borderWidth: 1, borderColor: colour.line }}>
      {days.map(date => {
        const selected = date === day;
        const foreground = selected ? '#FFFFFF' : colour.ink;
        const hasItems = board.entries.some(e => e.day === date) || board.meals.some(m => m.day === date);
        return <Pressable key={date} accessibilityRole="tab" aria-selected={selected} accessibilityState={{ selected }}
          accessibilityLabel={displayDay(date, { weekday: 'long', day: 'numeric', month: 'long' }) + (date === board.today ? ', today' : '')}
          onPress={() => selectDay(date)} style={({ pressed }) => ({
            flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 10, gap: 1,
            backgroundColor: selected ? colour.green : pressed ? colour.sage : 'transparent' })}>
          <Body small bold style={{ color: foreground, fontSize: width < 420 ? 11 : 13 }}>{displayDay(date, { weekday: 'short' })}</Body>
          <Body style={{ fontFamily: fonts.title, fontSize: 24, lineHeight: 28, color: foreground }}>{Number(date.slice(8))}</Body>
          <View style={{ width: date === board.today ? 16 : 5, height: 4, borderRadius: 2,
            backgroundColor: (hasItems || date === board.today) ? (selected ? '#DCE9BC' : colour.clay) : 'transparent' }} />
        </Pressable>;
      })}
    </View>
    <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'flex-start' : 'stretch', gap: 14 }}>
      <Box style={isWide ? { flex: 1.22 } : undefined}>
        <Heading>{displayDay(day, { weekday: 'long', day: 'numeric', month: 'long' })}</Heading>
        {dayEntries.length === 0 && selectedMeals.length === 0 && <Body small>No events, chores or meals planned for this day.</Body>}
        {dayEntries.map(entry => {
          const person = board.people.find(p => p.id === entry.personId);
          const detail = [entry.startTime ? [entry.startTime, entry.endTime].filter(Boolean).join('–') : 'All day', person?.name ?? 'Everyone'].join(' · ');
          const open = () => edit({ type: 'entry', item: entry, day });
          return <View key={entry.id} style={[s.rule, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
            <View style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', backgroundColor: person?.colour ?? colour.green }} />
            {entry.kind === 'chore' ? <><Check label={entry.title} detail={detail} checked={entry.done} disabled={busy}
              onPress={() => toggle(entry.id, !entry.done)} /><Btn label={'Edit ' + entry.title} onPress={open}>Edit</Btn></>
              : <Pressable accessibilityRole="button" accessibilityLabel={'Edit ' + entry.title} onPress={open}
                style={[s.grow, { minHeight: 44, justifyContent: 'center' }]}><Body bold>{entry.title}</Body><Body small>{detail}</Body></Pressable>}
          </View>;
        })}
        {selectedMeals.map(meal => <Pressable key={meal.id} accessibilityRole="button"
          accessibilityLabel={'Edit ' + meal.slot + ' on ' + day} onPress={() => edit({ type: 'meal', day, item: meal })}
          style={{ padding: 12, borderRadius: 10, backgroundColor: colour.sage }}>
          <Body small bold>{meal.slot} · {meal.servings} servings</Body><Body>{recipes.get(meal.recipeId)?.title}</Body>
        </Pressable>)}
        <View style={s.row}><Btn tone="primary" onPress={() => edit({ type: 'entry', day })}>Add event or chore</Btn></View>
      </Box>
      <Box style={isWide ? { flex: 1 } : undefined}>
        <View style={s.between}><Heading>Meal plan</Heading>
          {board.recipes.length > 0 ? <Btn onPress={() => edit({ type: 'meal', day })}>Plan meal</Btn>
            : <Btn onPress={() => edit({ type: 'recipe' })}>Add recipe</Btn>}</View>
        {days.map(date => {
          const meals = board.meals.filter(m => m.day === date);
          return <View key={date} style={[s.rule, { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
            <View style={{ width: 62, paddingTop: 4 }}><Body small bold>{displayDay(date, { weekday: 'short' })} {Number(date.slice(8))}</Body></View>
            <View style={[s.grow, { gap: 4 }]}>{meals.length ? meals.map(m =>
              <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={'Edit ' + m.slot + ' for ' + date}
                style={{ minHeight: 44 }} onPress={() => edit({ type: 'meal', day: date, item: m })}>
                <Body small>{m.slot}</Body><Body bold>{recipes.get(m.recipeId)?.title}</Body>
              </Pressable>) : <Pressable accessibilityRole="button" accessibilityLabel={'Plan a meal for ' + date}
                style={{ minHeight: 44, paddingTop: 3 }} onPress={() => board.recipes.length
                  ? edit({ type: 'meal', day: date }) : edit({ type: 'recipe' })}><Body small>+ Add meal</Body></Pressable>}</View>
          </View>;
        })}
      </Box>
    </View>
  </View>;
}
