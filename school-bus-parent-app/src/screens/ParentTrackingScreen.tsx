import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, StatusBar, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useParentLiveBus } from '../hooks/useParentLiveBus';
import { getParentContext, type ParentContext } from '../services/api';

type Props = { route: { params: { token: string } } };

export function ParentTrackingScreen({ route }: Props) {
  const token = route.params.token;
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [ctx, setCtx] = useState<ParentContext | null>(null);
  const activeBusId = ctx?.students?.[0]?.busId ?? '';

  // Smooth animated coordinates for Swiggy-style marker
  const animLat = useRef(new Animated.Value(15.1494)).current;
  const animLng = useRef(new Animated.Value(76.9414)).current;
  const [markerCoord, setMarkerCoord] = useState({ latitude: 15.1494, longitude: 76.9414 });

  const { location, status, attendance, activeTrip } = useParentLiveBus(API_BASE, token, activeBusId);

  // Load parent context on mount to auto-detect bus
  useEffect(() => {
    if (!token) return;
    getParentContext(token)
      .then(setCtx)
      .catch(() => {});
  }, [token]);

  // Pulse animation
  useEffect(() => {
    if (status !== 'WS_CONNECTED') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [status]);

  // === CORE: Swiggy-style smooth animated marker movement ===
  useEffect(() => {
    if (!location) return;

    // Smoothly animate lat and lng independently over 2 seconds
    Animated.parallel([
      Animated.timing(animLat, { toValue: location.latitude, duration: 2000, useNativeDriver: false }),
      Animated.timing(animLng, { toValue: location.longitude, duration: 2000, useNativeDriver: false }),
    ]).start(() => {
      // Update discrete coord state after animation so map can re-render marker
      setMarkerCoord({ latitude: location.latitude, longitude: location.longitude });
    });

    mapRef.current?.animateCamera(
      { center: { latitude: location.latitude, longitude: location.longitude }, zoom: 16 },
      { duration: 2000 },
    );
  }, [location?.latitude, location?.longitude]);

  const studentName = ctx?.students?.[0]?.name ?? 'Your child';
  const busLabel = ctx?.students?.[0]?.bus?.registrationNumber ?? activeBusId;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{ latitude: 15.1494, longitude: 76.9414, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          mapType="standard"
          showsUserLocation={false}
        >
          {/* Smooth animated bus marker */}
          {location && (
            <Marker
              coordinate={markerCoord}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* Pulsing ring */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: status === 'WS_CONNECTED' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                    transform: [{ scale: pulseAnim }],
                  }}
                />
                {/* Bus icon */}
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: status === 'WS_CONNECTED' ? '#10B981' : '#F59E0B',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 3, borderColor: '#fff',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
                  }}
                >
                  <Ionicons name="bus" size={16} color="#fff" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Top Header */}
        <LinearGradient
          colors={['rgba(2,6,23,0.95)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Live Bus Tracking</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                {busLabel || 'Locating bus…'}
              </Text>
            </View>
            {/* Connection pill */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: '#1E293B',
            }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4, marginRight: 6,
                backgroundColor: status === 'WS_CONNECTED' ? '#10B981' : status === 'POLLING' ? '#F59E0B' : '#64748B',
              }} />
              <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: '700' }}>
                {status === 'WS_CONNECTED' ? 'LIVE' : status === 'POLLING' ? 'CONNECTING' : 'OFFLINE'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bottom Card */}
        <View style={{ position: 'absolute', bottom: 24, left: 16, right: 16 }}>
          <View style={{
            backgroundColor: '#0F172A', borderRadius: 28, padding: 22,
            borderWidth: 1, borderColor: '#1E293B',
            shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
          }}>
            {activeTrip ? (
              <>
                {/* Student info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 14, backgroundColor: '#1E293B',
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 22 }}>👦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '800' }}>{studentName}</Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: attendance === 'IN' ? '#064E3B' : '#1E293B',
                      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4,
                    }}>
                      <Text style={{ color: attendance === 'IN' ? '#6EE7B7' : '#94A3B8', fontSize: 12, fontWeight: '700' }}>
                        {attendance === 'IN' ? '✅ ON BUS' : '🏠 NOT BOARDED'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#1E293B', marginBottom: 16 }} />

                {/* Stats row */}
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#10B981', fontSize: 20, fontWeight: '800' }}>
                      {location ? '●' : '–'}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>GPS Active</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#1E293B' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '800' }}>
                      {location ? 'Live' : '--'}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>Bus Location</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#1E293B' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '800' }}>
                      {location?.recordedAt ? new Date(location.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>Last Update</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🌙</Text>
                <Text style={{ color: '#F8FAFC', fontSize: 17, fontWeight: '700' }}>Bus Not Started</Text>
                <Text style={{ color: '#64748B', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                  The driver hasn't started the trip yet.{'\n'}You'll see live tracking once it begins.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
