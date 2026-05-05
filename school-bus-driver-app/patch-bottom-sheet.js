const fs = require('fs');
let file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/components/sheets/StudentBottomSheet.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "students: Student[];",
  "students: Student[];\n  staff?: Array<{id: string; name: string}>;"
);

content = content.replace(
  "export function StudentBottomSheet({ students, attendanceMap, tripId, sending, onMarkAttendance }: Props) {",
  "export function StudentBottomSheet({ students, staff = [], attendanceMap, tripId, sending, onMarkAttendance }: Props) {"
);

const staffHeader = `
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
`;

content = content.replace(
  "students.map((s) =>",
  staffHeader + "\n          {students.map((s) =>"
);

fs.writeFileSync(file, content);
console.log('patched bottom sheet');
