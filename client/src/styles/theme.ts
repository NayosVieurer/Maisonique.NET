import { StyleSheet } from 'react-native';

export const colour = {
  ink: '#183B31',
  mute: '#50665B',
  green: '#205640',
  sage: '#E6EEE2',
  paper: '#FAF9F5',
  card: '#FFFFFF',
  line: '#D8DED4',
  clay: '#89452F',
  blush: '#F8E9E0',
  cream: '#F1F0E6',
};

export const fonts = {
  normal: 'DMSans_400Regular',
  bold: 'DMSans_600SemiBold',
  title: 'DMSerifText_400Regular',
};

export const palette = [
  { name: 'Forest', value: '#32634B' },
  { name: 'Terracotta', value: '#A85038' },
  { name: 'Blue', value: '#3D6284' },
  { name: 'Plum', value: '#75557F' },
  { name: 'Ochre', value: '#846325' },
  { name: 'Teal', value: '#28716D' },
];

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  stack: { gap: 14 },
  field: { gap: 6 },
  grow: { flex: 1, minWidth: 0 },
  card: {
    backgroundColor: colour.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colour.line,
    gap: 15,
  },
  rule: { borderTopWidth: 1, borderTopColor: colour.line, paddingTop: 12 },
  body: { fontSize: 15, lineHeight: 22, color: colour.ink, fontFamily: fonts.normal },
  small: { fontSize: 13, lineHeight: 19, color: colour.mute, fontFamily: fonts.normal },
  strong: { fontFamily: fonts.bold },
  heading: { fontSize: 26, lineHeight: 32, fontFamily: fonts.title, color: colour.ink },
  title: { fontSize: 40, lineHeight: 48, fontFamily: fonts.title, color: colour.ink },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#AAB7AC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFEFC',
    fontFamily: fonts.normal,
    color: colour.ink,
    fontSize: 16,
  },
  option: {
    minHeight: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colour.line,
    backgroundColor: colour.card,
    paddingVertical: 9,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colour.sage, borderColor: colour.green },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
