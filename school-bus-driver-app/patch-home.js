const fs = require('fs');
const file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-driver-app/src/screens/HomeScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace("import { clearToken }", "import { clearToken, getDriverContext, type DriverContext }");
content = content.replace("import React, { useEffect, useRef } from 'react';", "import React, { useEffect, useRef, useState } from 'react';");

// Inside HomeScreen
const hooks = `
  const [ctx, setCtx] = useState<DriverContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getDriverContext(token)
        .then(setCtx)
        .catch(e => console.warn('Failed driver ctx', e))
        .finally(() => setLoading(false));
    }
  }, [token]);
`;
content = content.replace("const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });", "const dateStr = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });\n" + hooks);

// Replace Stats
content = content.replace('<StatCard label="Trips Done" value="2" color="#3B82F6" />', '{/* Trips Done */}\n            <StatCard label="Trips Done" value={ctx?.tripsDone.toString() ?? "0"} color="#3B82F6" />');
content = content.replace('<StatCard label="Students" value="24" color="#10B981" />', '<StatCard label="Students" value={ctx?.bus?.studentsCount.toString() ?? "0"} color="#10B981" />');

// Replace system connection info to show assigned bus
content = content.replace('<Text style={{ color: \'#94A3B8\', fontSize: 14 }}>Backend connected · GPS ready · WebSocket available</Text>', '<Text style={{ color: \'#94A3B8\', fontSize: 14 }}>\n              {ctx?.bus ? `Assigned Bus: ${ctx.bus.registrationNumber} · ${ctx.bus.studentsCount} Students` : "Backend connected · GPS ready · WebSocket available"}\n            </Text>');

fs.writeFileSync(file, content);
console.log('patched home');
