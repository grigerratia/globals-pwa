const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Import logger at the very top
if (!code.includes("import './utils/logger'")) {
  code = "import './utils/logger';\n" + code;
}

// Import DebugConsole and Bug icon if not there
if (!code.includes("DebugConsole")) {
  code = code.replace("import DinamoAgent", "import DinamoAgent from \"./components/Dinamo/DinamoAgent\";\nimport DebugConsole from \"./components/DebugConsole\";\nimport { Bug } from \"lucide-react\";\n// import DinamoAgent");
}

// Add state
if (!code.includes("const [debugOpen, setDebugOpen]")) {
  code = code.replace("const [dinamoOpen, setDinamoOpen] = useState(false);", "const [dinamoOpen, setDinamoOpen] = useState(false);\n  const [debugOpen, setDebugOpen] = useState(false);");
}

// Render DebugConsole
if (!code.includes("<DebugConsole")) {
  code = code.replace("{dinamoOpen && <DinamoAgent onClose={() => setDinamoOpen(false)} />}", "{dinamoOpen && <DinamoAgent onClose={() => setDinamoOpen(false)} />}\n      {debugOpen && <DebugConsole onClose={() => setDebugOpen(false)} />}");
}

// Add Bug icon to footer
if (!code.includes("setDebugOpen(true)")) {
  const bugIconHtml = `
        <span>|</span>
        <button onClick={() => setDebugOpen(true)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.5 }} title="Ver registro de errores">
          <Bug size={12} />
        </button>
      </div>`;
  code = code.replace("</div>\n    </>\n  );\n}", bugIconHtml + "\n    </>\n  );\n}");
}

fs.writeFileSync('src/App.jsx', code);
