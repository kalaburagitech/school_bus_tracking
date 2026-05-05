import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StatusBar, Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, Polyline } from 'react-native-maps';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { DriverStackParamList } from '../navigation/DriverNavigator';
import { useDriverTrackingFlow } from '../hooks/useDriverTrackingFlow';
import { StudentBottomSheet } from '../components/sheets/StudentBottomSheet';

type Props = {
  navigation: StackNavigationProp<DriverStackParamList, 'Map'>;
  route: RouteProp<DriverStackParamList, 'Map'>;
};

export function DriverMapScreen({ navigation, route }: Props) {
  const token = route.params?.token ?? '';
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    tripState, error, sending, tripStarting,
    attendanceMap, pendingQueue,
    beginTrip, endTrip, markAttendance,
  } = useDriverTrackingFlow(token);

  // Pulse animation when GPS is active
  useEffect(() => {
    if (!tripState) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [tripState?.tripId]);

  // Auto-center map on GPS updates
  useEffect(() => {
    if (tripState && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: tripState.latitude, longitude: tripState.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800,
      );
    }
  }, [tripState?.latitude, tripState?.longitude]);

  const handleEndTrip = () => {
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Trip', style: 'destructive', onPress: () => void endTrip() },
    ]);
  };

  const defaultRegion = { latitude: 15.1494, longitude: 76.9414, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  const busLocation = tripState
    ? { latitude: tripState.latitude, longitude: tripState.longitude }
    : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={defaultRegion}
          mapType="standard"
          showsUserLocation={false}
          showsTraffic
        >
          {busLocation && (
            <>
              <Marker coordinate={busLocation} title="My Location" anchor={{ x: 0.5, y: 0.5 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={{
                    position: 'absolute', width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#3B82F640',
                    transform: [{ scale: pulseAnim }],
                  }} />
                  <View style={{
                    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563EB',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 3, borderColor: '#fff',
                  }}>
                    <Text style={{ fontSize: 14 }}>🚌</Text>
                  </View>
                </View>
              </Marker>
              {/* Student stop markers */}
              {tripState!.students.filter(s => s.latitude && s.longitude).map((s) => (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
                  title={s.name}
                  description={attendanceMap[s.id] === 'PICKUP' ? '✅ Picked Up' : '⏳ Waiting'}
                  pinColor={attendanceMap[s.id] === 'PICKUP' ? '#10B981' : '#F59E0B'}
                />
              ))}
            </>
          )}
        </MapView>

        {/* Top overlay: back + trip info */}
        <View style={{
          position: 'absolute', top: 52, left: 16, right: 16,
        }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: 'rgba(2,6,23,0.85)', borderRadius: 14, width: 44, height: 44,
                alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E293B',
              }}
            >
              <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
            </TouchableOpacity>

            <View style={{
              flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10,
              borderWidth: 1, borderColor: '#1E293B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {tripState ? (
                <>
                  <View>
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>● TRIP ACTIVE</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                      GPS {tripState.gpsAccuracy ? `±${Math.round(tripState.gpsAccuracy)}m` : 'locked'} · queue {pendingQueue}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {sending && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />}
                    <TouchableOpacity
                      onPress={handleEndTrip}
                      style={{ backgroundColor: '#7F1D1D', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '700' }}>END</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  {tripStarting ? 'Starting trip...' : 'No active trip'}
                </Text>
              )}
            </View>
          </View>

          {error ? (
            <View style={{
              backgroundColor: 'rgba(127,29,29,0.9)', borderRadius: 14, padding: 12, marginTop: 10,
              borderWidth: 1, borderColor: '#7F1D1D',
            }}>
              <Text style={{ color: '#FCA5A5', fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom: start trip button or student sheet */}
        {!tripState ? (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 36 }}>
            <TouchableOpacity
              onPress={() => void beginTrip()}
              disabled={tripStarting}
              style={{
                backgroundColor: '#2563EB', borderRadius: 20, paddingVertical: 20,
                alignItems: 'center', opacity: tripStarting ? 0.7 : 1,
                shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                {tripStarting ? '⏳ Starting Trip...' : '🚌 Start Trip & Track GPS'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <StudentBottomSheet
            students={tripState.students}
            staff={tripState.staff}
            attendanceMap={attendanceMap}
            tripId={tripState.tripId}
            sending={sending}
            onMarkAttendance={markAttendance}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
