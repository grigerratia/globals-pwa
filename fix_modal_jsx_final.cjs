const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.jsx', 'utf-8');

// The code failed to build because we inserted the opening fragment `showMoreInfo && ( <>` but didn't close it correctly.
// Let's remove the bad unclosed fragments and re-do it right.

// We will find `</>)}` if we already put it incorrectly, or just replace the end of mainCol.
// First, strip out any stray `</>)}` that are orphaned.
code = code.replace(/<\/>\n\s*\)}\n\s*<\/div>\n\n\s*\{\/\* SIDEBAR \*\/\}/g, '</div>\n\n          {/* SIDEBAR */}');

// The mainCol ends at line 587 (`          </div>`). 
// Let's find exactly the pattern ending mainCol:
//             </div>
// 
//           </div>
// 
//           {/* SIDEBAR (Acciones) */}

const endOfMainColPattern = /<\/div>\s*\n\s*<\/div>\s*\n\s*\{\/\* SIDEBAR \(Acciones\) \*\/\}/;

code = code.replace(endOfMainColPattern, "</div>\n            </>\n            )}\n          </div>\n\n          {/* SIDEBAR (Acciones) */}");

fs.writeFileSync('src/components/Modals/ProjectDetailModal.jsx', code);
console.log("Fixed mainCol end.");
