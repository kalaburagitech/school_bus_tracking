import React, { useMemo, useCallback } from 'react';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { Student } from '../../services/api';

type Props = {
  students: Student[];
  staff?: Array<{id: string; name: string}>;
  attendanceMap: Record<string, 'PICKUP' | 'DROPOFF' | null>;
  tripId: string;
  sending: boolean;
  onMarkAttendance: (studentId: string, type: 'PICKUP' | 'DROPOFF') => void;
};

function StudentRow({
  student,
  attendance,
  sending,
  onPickup,
  onDropoff,
}: {
  student: Student;
  attendance: 'PICKUP' | 'DROPOFF' | null | undefined;
  sending: boolean;
  onPickup: () => void;
  onDropoff: () => void;
}) {
  const initials = student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const isPicked = attendance === 'PICKUP';
  const isDropped = attendance === 'DROPOFF';

  return (
    <View style={{
      backgroundColor: '#0F172A', borderRadius: 16, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: isPicked ? '#065F46' : isDropped ? '#4B1D1D' : '#1E293B',
      flexDirection: 'row', alignItems: 'center',
    }}>
      {/* Avatar */}
      <View style={{
        width: 44, height: 44, borderRadius: 14, backgroundColor: isPicked ? '#059669' : '#1E293B',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '800' }}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '700' }}>{student.name}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
          {student.studentClass ?? 'Student'} {student.address ? `· ${student.address}` : ''}
        </Text>
        {attendance && (
          <Text style={{ color: isPicked ? '#10B981' : '#F87171', fontSize: 12, marginTop: 2, fontWeight: '600' }}>
            {isPicked ? '✅ Picked Up' : '🏁 Dropped Off'}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TouchableOpacity
          onPress={onPickup}
          disabled={sending || isPicked}
          style={{
            backgroundColor: isPicked ? '#065F46' : '#1E293B',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
            opacity: isPicked ? 0.7 : 1,
          }}
        >
          <Text style={{ color: isPicked ? '#6EE7B7' : '#94A3B8', fontSize: 11, fontWeight: '700' }}>IN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDropoff}
          disabled={sending || isDropped}
          style={{
            backgroundColor: isDropped ? '#4B1D1D' : '#1E293B',
            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
            opacity: isDropped ? 0.7 : 1,
          }}
        >
          <Text style={{ color: isDropped ? '#FCA5A5' : '#94A3B8', fontSize: 11, fontWeight: '700' }}>OUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function StudentBottomSheet({ students, staff = [], attendanceMap, tripId, sending, onMarkAttendance }: Props) {
  const snapPoints = useMemo(() => ['22%', '52%', '88%'], []);

  const pickedCount = Object.values(attendanceMap).filter((v) => v === 'PICKUP').length;
  const droppedCount = Object.values(attendanceMap).filter((v) => v === 'DROPOFF').length;

  return (
    <BottomSheet
      index={1}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: '#0A0F1E' }}
      handleIndicatorStyle={{ backgroundColor: '#334155', width: 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#F8FAFC', fontSize: 17, fontWeight: '800' }}>Passenger List</Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 3 }}>
              {students.length} students · {pickedCount} picked · {droppedCount} dropped
            </Text>
          </View>
          {sending && <ActivityIndicator color="#3B82F6" size="small" />}
        </View>

        {/* Progress bar */}
        {students.length > 0 && (
          <View style={{ marginTop: 10, backgroundColor: '#1E293B', borderRadius: 6, height: 6 }}>
            <View style={{
              height: 6, borderRadius: 6, backgroundColor: '#10B981',
              width: `${(pickedCount / students.length) * 100}%`,
            }} />
          </View>
        )}
      </View>

      <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {students.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>👥</Text>
            <Text style={{ color: '#64748B', fontSize: 15 }}>No students on this bus yet</Text>
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 6 }}>Students will appear when assigned to the bus</Text>
          </View>
        ) : (
          <>
            {staff.length > 0 && (
              <View style={{ marginTop: 24, marginBottom: 12 }}>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Assigned Staff / Teachers</Text>
              </View>
            )}
            {staff.map((s) => (
              <View key={s.id} style={{
                backgroundColor: '#0F172A', borderRadius: 16, padding: 14, marginBottom: 10,
                borderWidth: 1, borderColor: '#1E293B', flexDirection: 'row', alignItems: 'center'
              }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: '800' }}>{(s.name || 'S').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '700' }}>{s.name}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Staff Member</Text>
                </View>
              </View>
            ))}

            {students.map((s) => (
              <StudentRow
                key={s.id}
                student={s}
                attendance={attendanceMap[s.id]}
                sending={sending}
                onPickup={() => onMarkAttendance(s.id, 'PICKUP')}
                onDropoff={() => onMarkAttendance(s.id, 'DROPOFF')}
              />
            ))}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
