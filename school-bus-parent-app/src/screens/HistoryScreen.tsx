import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { fetchHistory } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = { route: { params: { token: string } } };

type FormattedLog = {
  id: string;
  studentName: string;
  type: 'PICKUP' | 'DROPOFF';
  time: string;
  date: string;
};

export function HistoryScreen({ route }: Props) {
  const token = route.params.token;
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<FormattedLog[]>([]);
  const [summary, setSummary] = useState({ pickups: 0, dropoffs: 0 });

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      
      const res = await fetchHistory(token, from, to);
      const formatted = res.attendance.map((a) => ({
        id: a.id,
        studentName: a.student.name,
        type: a.type,
        time: new Date(a.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(a.recordedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      }));
      setLogs(formatted);
      setSummary({ pickups: res.summary.pickups ?? 0, dropoffs: res.summary.dropoffs ?? 0 });
    } catch {
      // quiet fail for now
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '800' }}>Attendance</Text>
      <Text style={{ color: '#94A3B8', fontSize: 15, marginTop: 4 }}>Past 7 Days</Text>
      
      <View style={{ flexDirection: 'row', marginTop: 24, gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#064E3B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#065F46' }}>
          <Text style={{ color: '#6EE7B7', fontSize: 13, fontWeight: '700' }}>PICKUPS</Text>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 4 }}>{summary.pickups}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#4C1D95', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#5B21B6' }}>
          <Text style={{ color: '#C4B5FD', fontSize: 13, fontWeight: '700' }}>DROPOFFS</Text>
          <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 4 }}>{summary.dropoffs}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', paddingTop: 60, paddingHorizontal: 20 }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color="#3B82F6" size="large" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isPickup = item.type === 'PICKUP';
            const showDateHeader = index === 0 || logs[index - 1].date !== item.date;

            return (
              <View>
                {showDateHeader && (
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10 }}>
                    {item.date.toUpperCase()}
                  </Text>
                )}
                <View style={{
                  backgroundColor: '#0F172A', borderRadius: 16, padding: 16, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B'
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 12, backgroundColor: isPickup ? '#064E3B' : '#4C1D95',
                    alignItems: 'center', justifyContent: 'center', marginRight: 16
                  }}>
                    <Ionicons name={isPickup ? "home" : "school"} size={20} color={isPickup ? "#6EE7B7" : "#C4B5FD"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '700' }}>{item.studentName}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
                      {isPickup ? 'Picked up from home' : 'Dropped at school'}
                    </Text>
                  </View>
                  <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '600' }}>{item.time}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="calendar-outline" size={64} color="#1E293B" />
              <Text style={{ color: '#64748B', fontSize: 15, marginTop: 16 }}>No attendance recorded recently</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
