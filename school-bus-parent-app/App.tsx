import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ParentNavigator } from './src/navigation/ParentNavigator';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar style="light" />
      <ParentNavigator />
    </SafeAreaProvider>
  );
}
