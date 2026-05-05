const fs = require('fs');
const file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/services/api.ts';
let content = fs.readFileSync(file, 'utf8');

const newCode = `
export type DriverContext = {
  tripsDone: number;
  bus: {
    id: string;
    registrationNumber: string;
    busNumber: string | null;
    studentsCount: number;
    staffCount: number;
    students: Student[];
    staff: Array<{ id: string; name: string | null }>;
  } | null;
};

export async function getDriverContext(token: string): Promise<DriverContext> {
  return withRetry(
    () => request<DriverContext>('/driver/me', { method: 'GET' }, token),
    { retries: 3 },
  );
}
`;

content = content.replace('export async function startTrip', newCode + '\nexport async function startTrip');
fs.writeFileSync(file, content);
console.log('patched api');
