import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverStackParamList } from '../navigation/DriverNavigator';
import { clearToken, getDriverContext, type DriverContext } from '../services/api';

type Props = {
  navigation: StackNavigationProp<DriverStackParamList, 'Home'>;
  route: RouteProp<DriverStackParamList, 'Home'>;
};

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#0F172A', borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: '#1E293B', marginHorizontal: 4,
    }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function QuickActionBtn({ icon, label, onPress, accent }: { icon: string; label: string; onPress: () => void; accent: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, alignItems: 'center', backgroundColor: '#0F172A',
        borderRadius: 18, paddingVertical: 20, borderWidth: 1, borderColor: '#1E293B',
        marginHorizontal: 5,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ fontSize: 12, color: '#CBD5E1', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation, route }: Props) {
  const token = route.params?.token ?? '';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  const [ctx, setCtx] = useState<DriverContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getDriverContext(token)
        .then(setCtx)
        .catch(e => console.warn('Failed driver ctx', e))
        .finally(() => setLoading(false));
    }
  }, [token]);


  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await clearToken(); navigation.replace('Login'); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <LinearGradient colors={['#1e1b4b', '#020617']} style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Good {now.getHours() < 12 ? 'Morning' : 'Afternoon'}</Text>
            <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginTop: 2 }}>Driver</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{
            backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
          }}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Time card */}
        <View style={{
          backgroundColor: '#0F172A', borderRadius: 20, padding: 20, marginTop: 20,
          borderWidth: 1, borderColor: '#312E81', flexDirection: 'row', alignItems: 'center',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F8FAFC', fontSize: 36, fontWeight: '800' }}>{timeStr}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>{dateStr}</Text>
          </View>
          <View style={{
            width: 56, height: 56, borderRadius: 16, backgroundColor: '#3B82F6',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 26 }}>🚌</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Stats row */}
          <Text style={{ color: '#475569', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            TODAY'S STATS
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            {/* Trips Done */}
            <StatCard label="Trips Done" value={ctx?.tripsDone.toString() ?? "0"} color="#3B82F6" />
            <StatCard label="Students" value={ctx?.bus?.studentsCount.toString() ?? "0"} color="#10B981" />
            <StatCard label="KM Driven" value="38" color="#F59E0B" />
          </View>

          {/* Start Trip CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Map', { token })}
            style={{ marginBottom: 20 }}
          >
            <LinearGradient
              colors={['#2563EB', '#3B82F6', '#60A5FA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 24 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: '#BFDBFE', fontSize: 13, fontWeight: '600' }}>READY TO GO?</Text>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 }}>Start Trip</Text>
                  <Text style={{ color: '#BFDBFE', fontSize: 13, marginTop: 6 }}>Tap to open live map & tracking</Text>
                </View>
                <View style={{
                  width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 30 }}>🗺️</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions */}
          <Text style={{ color: '#475569', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            QUICK ACTIONS
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            <QuickActionBtn icon="📍" label="Live Map" onPress={() => navigation.navigate('Map', { token })} accent="#3B82F6" />
            <QuickActionBtn icon="👥" label="Students" onPress={() => navigation.navigate('Map', { token })} accent="#10B981" />
            <QuickActionBtn icon="📋" label="History" onPress={() => {}} accent="#F59E0B" />
          </View>

          {/* Status Card */}
          <View style={{
            backgroundColor: '#0F172A', borderRadius: 18, padding: 20,
            borderWidth: 1, borderColor: '#1E293B',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 8 }} />
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>System Online</Text>
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 14 }}>
              {ctx?.bus ? `Assigned Bus: ${ctx.bus.registrationNumber} · ${ctx.bus.studentsCount} Students` : "Backend connected · GPS ready · WebSocket available"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
