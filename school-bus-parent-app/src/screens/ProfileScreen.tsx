import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clearToken } from '../services/api';

export function ProfileScreen({ navigation }: any) {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await clearToken(); navigation.getParent().replace('Login'); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#020617', paddingTop: 60, paddingHorizontal: 24 }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <Text style={{ color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginBottom: 24 }}>Profile Settings</Text>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 32 }}>👨</Text>
        </View>
        <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '700' }}>Parent Account</Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>Linked to your phone number</Text>
      </View>

      <View style={{ backgroundColor: '#0F172A', borderRadius: 20, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden', padding: 4 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
          <Ionicons name="people" size={24} color="#64748B" />
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginLeft: 16, flex: 1 }}>My Students</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
          <Ionicons name="notifications-outline" size={24} color="#64748B" />
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginLeft: 16, flex: 1 }}>Notification Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
          <Ionicons name="help-circle-outline" size={24} color="#64748B" />
          <Text style={{ color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginLeft: 16, flex: 1 }}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <Ionicons name="log-out-outline" size={24} color="#F87171" />
          <Text style={{ color: '#F87171', fontSize: 16, fontWeight: '600', marginLeft: 16 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
