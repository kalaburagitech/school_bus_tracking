const fs = require('fs');
let file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/services/api.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("students?: Student[];", "students?: Student[]; }\n    & { bus?: { students?: Student[] } };");
fs.writeFileSync(file, content);

file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/hooks/useDriverTrackingFlow.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace("students: trip.students ?? [],", "students: trip.bus?.students ?? trip.students ?? [],");
fs.writeFileSync(file, content);

console.log('patched flow');
