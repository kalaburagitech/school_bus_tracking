const fs = require('fs');
let file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/services/api.ts';
let content = fs.readFileSync(file, 'utf8');

// Update StartTripResponse
content = content.replace(
  "& { bus?: { students?: Student[] } };", 
  "& { bus?: { students?: Student[], staffAssignments?: Array<{ staff: { id: string; name: string } }> } };"
);
fs.writeFileSync(file, content);

// Update useDriverTrackingFlow
file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/hooks/useDriverTrackingFlow.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "students: Student[];",
  "students: Student[];\n  staff: Array<{id: string; name: string}>;"
);
content = content.replace(
  "students: trip.bus?.students ?? trip.students ?? [],",
  "students: trip.bus?.students ?? trip.students ?? [],\n        staff: trip.bus?.staffAssignments?.map((a: any) => a.staff) ?? [],"
);
fs.writeFileSync(file, content);

// Update DriverMapScreen
file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/screens/DriverMapScreen.tsx';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "students={tripState.students}",
  "students={tripState.students}\n            staff={tripState.staff}"
);
fs.writeFileSync(file, content);

console.log('patched staff passing');
