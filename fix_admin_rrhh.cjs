const fs = require('fs');
const file = './src/components/AdminRRHHDashboard/AdminRRHHDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const fetchData = async \(\) => \{/, 'async function fetchData() {');

fs.writeFileSync(file, code);
