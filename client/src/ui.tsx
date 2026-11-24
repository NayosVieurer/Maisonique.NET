import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  View, type TextInputProps, type TextStyle, type ViewStyle, type StyleProp } from 'react-native';

export const colour = {
  ink: '#183B31', mute: '#50665B', green: '#205640', sage: '#E6EEE2', paper: '#FAF9F5',
  card: '#FFFFFF', line: '#D8DED4', clay: '#89452F', blush: '#F8E9E0', cream: '#F1F0E6'
};
export const fonts = { normal: 'DMSans_400Regular', bold: 'DMSans_600SemiBold', title: 'DMSerifText_400Regular' };
export const palette = [
  { name: 'Forest', value: '#32634B' }, { name: 'Terracotta', value: '#A85038' },
  { name: 'Blue', value: '#3D6284' }, { name: 'Plum', value: '#75557F' },
  { name: 'Ochre', value: '#846325' }, { name: 'Teal', value: '#28716D' }
];
export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  stack: { gap: 14 }, field: { gap: 6 }, grow: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colour.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colour.line, gap: 15 },
  rule: { borderTopWidth: 1, borderTopColor: colour.line, paddingTop: 12 },
  body: { fontSize: 15, lineHeight: 22, color: colour.ink, fontFamily: fonts.normal },
  small: { fontSize: 13, lineHeight: 19, color: colour.mute, fontFamily: fonts.normal },
  strong: { fontFamily: fonts.bold },
  heading: { fontSize: 26, lineHeight: 32, fontFamily: fonts.title, color: colour.ink },
  title: { fontSize: 40, lineHeight: 48, fontFamily: fonts.title, color: colour.ink },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#AAB7AC', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 9, backgroundColor: '#FFFEFC', fontFamily: fonts.normal, color: colour.ink, fontSize: 16 },
  option: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: colour.line, backgroundColor: colour.card,
    paddingVertical: 9, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colour.sage, borderColor: colour.green },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
export function Body({ children, small, bold, style }: { children: ReactNode; small?: boolean; bold?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[small ? s.small : s.body, bold && s.strong, style]}>{children}</Text>;
}
export function Heading({ children, large }: { children: ReactNode; large?: boolean }) {
  return <Text accessibilityRole="header" style={large ? s.title : s.heading}>{children}</Text>;
}
export function Btn({ children, onPress, tone = 'normal', label, disabled = false }: {
  children: string; onPress: () => void; tone?: 'normal' | 'primary' | 'danger'; label?: string; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label ?? children} disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [s.option,
      tone === 'primary' && { backgroundColor: colour.green, borderColor: colour.green },
      tone === 'danger' && { backgroundColor: colour.blush, borderColor: '#E6CBBF' }, { opacity: disabled || pressed ? 0.65 : 1 }]}>
    <Body bold style={{ color: tone === 'primary' ? '#FFF' : tone === 'danger' ? colour.clay : colour.ink }}>{children}</Body>
  </Pressable>;
}
export function Choice({ title, active, onPress, label, dot }: {
  title: string; active: boolean; onPress: () => void; label?: string; dot?: string;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label ?? title} aria-checked={active} accessibilityState={{ checked: active }}
    onPress={onPress} style={({ pressed }) => [s.option, active && s.active, { opacity: pressed ? 0.75 : 1 }]}>
    <View style={[s.row, { gap: 6 }]}>{dot && <View style={[s.dot, { backgroundColor: dot }]} />}
      <Body small bold={active}>{title}</Body></View>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={s.field}><Body small bold>{label}</Body>
    <TextInput accessibilityLabel={label} placeholderTextColor="#647268" {...props}
      style={[s.input, props.multiline && { minHeight: 85, textAlignVertical: 'top' }, props.style]} />
  </View>;
}
export function Box({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Notice({ text }: { text: string }) {
  return <View accessibilityRole="alert" style={{ backgroundColor: colour.blush, borderRadius: 8, padding: 12 }}>
    <Body style={{ color: colour.clay }}>{text}</Body></View>;
}
export function Check({ label, checked, onPress, detail, disabled }: {
  label: string; checked: boolean; onPress: () => void; detail?: string; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} aria-checked={checked} accessibilityState={{ checked, disabled }}
    disabled={disabled} onPress={onPress} style={[s.row, { minHeight: 44, flex: 1, flexWrap: 'nowrap' }]}>
    <View style={{ width: 27, height: 27, borderRadius: 8, borderWidth: 1.5, borderColor: colour.green,
      alignItems: 'center', justifyContent: 'center', backgroundColor: checked ? colour.green : colour.card }}>
      {checked && <Body bold style={{ color: '#FFF' }}>✓</Body>}
    </View>
    <View style={s.grow}><Body style={checked ? { textDecorationLine: 'line-through', color: colour.mute } : {}}>{label}</Body>
      {!!detail && <Body small>{detail}</Body>}</View>
  </Pressable>;
}
export function Dialog({ title, children, close, busy = false }: {
  title: string; children: ReactNode; close: () => void; busy?: boolean;
}) {
  return <Modal transparent animationType="fade" onRequestClose={() => { if (!busy) close(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{
      flex: 1, backgroundColor: 'rgba(20,40,31,0.45)', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 640, maxHeight: '93%', backgroundColor: colour.paper,
        borderRadius: 18, padding: 16, gap: 8, flexShrink: 1 }}>
        <View style={s.between}><Heading>{title}</Heading><Btn disabled={busy} onPress={close}>Close</Btn></View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 14, padding: 2 }}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
