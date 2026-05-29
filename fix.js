import fs from 'fs';
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace(/\\\$\{/g, '${');
fs.writeFileSync('src/App.jsx', code);
