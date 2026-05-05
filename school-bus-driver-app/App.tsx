import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DriverNavigator } from './src/navigation/DriverNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar style="light" />
      <DriverNavigator />
    </SafeAreaProvider>
  );
}
