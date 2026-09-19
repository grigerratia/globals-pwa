const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.jsx', 'utf-8');

// 1. Move icons inside h3 for ALL sections
code = code.replace(/<([A-Za-z]+) className=\{styles\.icon\} size=\{24\}(.*?)\/>\s*<div className=\{styles\.sectionContent\}>\s*<h3(.*?)>(.*?)<\/h3>/g, 
  (match, iconName, iconStyles, h3Styles, titleText) => {
    return `<div className={styles.sectionContent}>\n                <h3${h3Styles}><${iconName} className={styles.icon} size={20}${iconStyles}/> ${titleText}</h3>`;
});

// 2. Wrap secondary info in showMoreInfo
// We want to wrap from "Hoja de Levantamiento" OR "FINANZAS Y RENTABILIDAD" to the end of mainCol.
// The end of mainCol is just before {/* SIDEBAR */}

// Find where Materiales section ends. The next sibling could be Hoja de Levantamiento or Finanzas.
// Let's insert the button right before `{proyecto.estado === 'Levantamiento' && (`
const hookText = "{proyecto.estado === 'Levantamiento' && (";
if (code.includes(hookText) && !code.includes('Ocultar información adicional')) {
  const insertText = `
            <button 
              className={styles.toggleMoreBtn} 
              onClick={() => setShowMoreInfo(!showMoreInfo)}
            >
              {showMoreInfo ? 'Ocultar información adicional' : 'Ver más información (Archivos, Finanzas, etc.)'}
            </button>

            {showMoreInfo && (
              <>
            `;
  code = code.replace(hookText, insertText + hookText);
  
  // Close the fragment right before {/* SIDEBAR */}
  code = code.replace(/<\/div>\s*\{\/\* SIDEBAR \*\/\}/g, "  </>\n            )}\n          </div>\n\n          {/* SIDEBAR */}");
}

// 3. For the Sidebar, let's wrap "Log de Actividad" (and Fechas)
const sidebarHook = "<h4 style={{ marginTop: '2rem' }}>Log de Actividad</h4>";
if (code.includes(sidebarHook) && !code.includes('showMoreInfo && ( <h4 style={{ marginTop: \'2rem\' }}>Log de Actividad</h4>')) {
  // Let's replace the start
  code = code.replace(sidebarHook, "{showMoreInfo && ( <>\n            " + sidebarHook);
  
  // Let's find the end of the sidebar. 
  // It ends with:
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  const endSidebar = /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/m;
  code = code.replace(endSidebar, "  </>)}\n\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n");
}


// Add showMoreInfo state if missing
if (!code.includes('const [showMoreInfo')) {
  code = code.replace("const [showLevantamiento, setShowLevantamiento] = useState(false);", 
                      "const [showLevantamiento, setShowLevantamiento] = useState(false);\n  const [showMoreInfo, setShowMoreInfo] = useState(false);");
}

fs.writeFileSync('src/components/Modals/ProjectDetailModal.jsx', code);
console.log("Updated JSX correctly.");
