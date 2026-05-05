import React from 'react';
import { View, Text, FlatList, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
};

const DUMMY_NOTIFS: NotificationItem[] = [
  { id: '1', title: 'Start of Trip', message: 'School bus 4A has started its route', time: '10 mins ago', isRead: false },
  { id: '2', title: 'Almost there!', message: 'The bus is 5 minutes away from your stop', time: '5 mins ago', isRead: false },
];

export function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020617', paddingTop: 60, paddingHorizontal: 20 }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '800' }}>Updates</Text>
        <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>Mark all read</Text>
      </View>

      <FlatList
        data={DUMMY_NOTIFS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: item.isRead ? '#020617' : '#0F172A',
            borderRadius: 16, padding: 16, marginBottom: 12,
            borderWidth: 1, borderColor: item.isRead ? '#1E293B' : '#312E81',
            flexDirection: 'row', alignItems: 'flex-start'
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E293B',
              alignItems: 'center', justifyContent: 'center', marginRight: 14
            }}>
              <Ionicons name="bus-outline" size={20} color={item.isRead ? '#64748B' : '#3B82F6'} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '700' }}>{item.title}</Text>
                <Text style={{ color: '#64748B', fontSize: 12 }}>{item.time}</Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4, lineHeight: 20 }}>{item.message}</Text>
            </View>
            {!item.isRead && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6, marginLeft: 8 }} />
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="notifications-off-outline" size={64} color="#1E293B" />
            <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginTop: 16 }}>All Caught Up!</Text>
            <Text style={{ color: '#64748B', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              You don't have any new notifications right now.
            </Text>
          </View>
        )}
      />
    </View>
  );
}
