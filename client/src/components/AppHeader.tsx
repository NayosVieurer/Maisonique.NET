import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { tabs, type Tab } from '../models/Tab';
import { colour, fonts, styles } from '../styles/theme';
import { displayDay } from '../utils/dates';
import { BodyText } from './BodyText';

interface AppHeaderProps {
  activeTab: Tab;
  today?: string;
  onSelect: (tab: Tab) => void;
}

const logoColours = ['#DCE9BC', '#DCE9BC', '#EFAE88', '#DCE9BC'];

export function AppHeader({ activeTab, today, onSelect }: AppHeaderProps) {
  const compact = useWindowDimensions().width < 550;

  return (
    <>
      <View style={[header.banner, { paddingHorizontal: compact ? 15 : 30 }]}>
        <View style={[styles.between, header.brandRow]}>
          <View style={[styles.row, header.brand]}>
            <View style={header.mark}>
              {logoColours.map((backgroundColor, index) => (
                <View
                  key={index}
                  style={[
                    header.tile,
                    { backgroundColor, borderRadius: index === 2 ? 5 : 2 },
                  ]}
                />
              ))}
            </View>
            <Text style={header.name}>Kitchen Table</Text>
          </View>

          {today && (
            <BodyText small style={header.date}>
              {displayDay(today, { weekday: 'short', day: 'numeric', month: 'short' })}
            </BodyText>
          )}
        </View>
      </View>

      <View style={header.navBorder}>
        <View
          accessibilityRole="tablist"
          accessibilityLabel="Main navigation"
          style={[
            header.nav,
            { gap: compact ? 0 : 10, paddingHorizontal: compact ? 6 : 24 },
          ]}
        >
          {tabs.map((tab) => {
            const selected = tab === activeTab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityLabel={tab}
                accessibilityState={{ selected }}
                aria-selected={selected}
                onPress={() => onSelect(tab)}
                style={[
                  header.tab,
                  {
                    paddingHorizontal: compact ? 4 : 16,
                    flex: compact ? 1 : undefined,
                    borderBottomColor: selected ? colour.green : 'transparent',
                  },
                ]}
              >
                <BodyText
                  small
                  bold={selected}
                  style={{ color: selected ? colour.green : colour.mute }}
                >
                  {tab}
                </BodyText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const header = StyleSheet.create({
  banner: { backgroundColor: colour.green },
  brandRow: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    minHeight: 62,
    flexWrap: 'nowrap',
  },
  brand: { flexWrap: 'nowrap', gap: 11 },
  mark: { width: 23, height: 23, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  tile: { width: 10, height: 10 },
  name: { fontFamily: fonts.title, fontSize: 25, color: '#FFF' },
  date: { color: '#EFF4E4' },
  navBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colour.line,
    backgroundColor: colour.card,
  },
  nav: { flexDirection: 'row', width: '100%', maxWidth: 1180, alignSelf: 'center' },
  tab: {
    minHeight: 49,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
});
