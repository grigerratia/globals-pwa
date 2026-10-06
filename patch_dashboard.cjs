const fs = require('fs');
const file = 'src/components/ExecutiveDashboard/ExecutiveDashboard.jsx';
let content = fs.readFileSync(file, 'utf-8');

// Export fetchLogs so we can call it manually
if (!content.includes('const fetchLogs = async () => {')) {
  content = content.replace('async function fetchData() {', `
  const fetchLogs = async () => {
    const { data: logs, error } = await supabase.from('audit_logs')
      .select('*')
      .neq('accion', 'Inició sesión')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) {
      alert("Error cargando actividad: " + error.message);
    } else if (logs) {
      setAuditLogs(logs);
    }
  };

  async function fetchData() {`);
  
  content = content.replace(/const \{ data: logs \} = await supabase\.from\('audit_logs'\)[\s\S]*?if \(logs\) \{\n\s*setAuditLogs\(logs\);\n\s*\}/g, 'await fetchLogs();');
  
  // Add a refresh button next to "Actividad Reciente"
  content = content.replace('<h2>Actividad Reciente</h2>', '<h2>Actividad Reciente</h2>\n            <button onClick={fetchLogs} style={{ marginLeft: "auto", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>Actualizar</button>');
  
  fs.writeFileSync(file, content);
  console.log('Patched ExecutiveDashboard');
}
