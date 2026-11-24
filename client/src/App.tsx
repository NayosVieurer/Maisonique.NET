import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSerifText_400Regular } from '@expo-google-fonts/dm-serif-text/400Regular';
import { useFonts } from 'expo-font';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HouseholdApp } from './screens/HouseholdApp';
import { colour } from './styles/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_600SemiBold,
    DMSerifText_400Regular,
  });

  return (
    <SafeAreaProvider>
      {fontsLoaded || fontError ? (
        <HouseholdApp />
      ) : (
        <ActivityIndicator
          accessibilityLabel="Loading Kitchen Table"
          color={colour.green}
        />
      )}
    </SafeAreaProvider>
  );
}
