const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ExecutiveDashboard/ExecutiveDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Add empty state message
content = content.replace(/\{auditLogs\.map\(log => \{/g, 
  '{auditLogs.length === 0 ? <p style={{ padding: "1rem", color: "#64748b", textAlign: "center", fontSize: "0.9rem" }}>No hay actividad reciente para mostrar.</p> : auditLogs.map(log => {');

// Add realtime subscription for audit_logs
if (!content.includes("'audit_logs_changes'")) {
  content = content.replace(/fetchData\(\);\n  \}, \[\]\);/g, 
    `fetchData();
    
    const channel = supabase.channel('audit_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        if (payload.new.accion !== 'Inició sesión') {
          setAuditLogs(prev => [payload.new, ...prev].slice(0, 30));
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);`);
}

fs.writeFileSync(file, content);
console.log('Activity list patched');
