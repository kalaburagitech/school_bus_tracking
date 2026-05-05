import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DriverMapScreen } from '../screens/DriverMapScreen';

export type DriverStackParamList = {
  Login: undefined;
  Home: { token: string };
  Map: { token: string };
};

const Stack = createStackNavigator<DriverStackParamList>();

export function DriverNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Home' | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('driver.accessToken').then((token) => {
      setSavedToken(token);
      setInitialRoute(token ? 'Home' : 'Login');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3B82F6" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#020617' } }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={savedToken ? { token: savedToken } : undefined}
        />
        <Stack.Screen name="Map" component={DriverMapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
