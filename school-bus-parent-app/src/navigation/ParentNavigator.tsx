import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { ParentTrackingScreen } from '../screens/ParentTrackingScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type ParentTabParamList = {
  Track: { token: string };
  History: { token: string };
  Notifications: { token: string };
  Profile: { token: string };
};

export type ParentStackParamList = {
  Login: undefined;
  Main: { token: string };
};

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createStackNavigator<ParentStackParamList>();

function MainTabNavigator({ route }: any) {
  const token = route.params?.token;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#020617', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'map';
          if (route.name === 'Track') iconName = 'map';
          else if (route.name === 'History') iconName = 'calendar';
          else if (route.name === 'Notifications') iconName = 'notifications';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Track" component={ParentTrackingScreen} initialParams={{ token }} />
      <Tab.Screen name="History" component={HistoryScreen} initialParams={{ token }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} initialParams={{ token }} />
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ token }} />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main' | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('parent.accessToken').then((token) => {
      setSavedToken(token);
      setInitialRoute(token ? 'Main' : 'Login');
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
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} initialParams={savedToken ? { token: savedToken } : undefined} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
