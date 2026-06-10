const fs = require('fs');
const path = require('path');

const files = [
  'src/App.jsx',
  'src/components/Attendance.jsx',
  'src/components/CRM.jsx',
  'src/components/GodMode.jsx',
  'src/components/Login.jsx',
  'src/components/Logs.jsx',
  'src/components/NotificationCenter.jsx',
  'src/components/Overview.jsx',
  'src/components/ProjectManagement.jsx',
  'src/components/ProjectManager.jsx',
  'src/components/RecentActivityPanel.jsx',
  'src/components/TeamTracker.jsx',
  'src/components/TicketManager.jsx',
  'src/components/TimeTracker.jsx',
  'src/components/Tokens.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // Skip if already refactored
  if (content.includes('apiFetch(')) return;

  // 1. Replace fetch( with apiFetch(
  content = content.replace(/\bfetch\(/g, 'apiFetch(');

  // 2. Add import for apiFetch
  const importPath = f === 'src/App.jsx' ? './utils/api' : '../utils/api';
  if (content.includes('apiFetch(')) {
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    if (lastImportIdx !== -1) {
      lines.splice(lastImportIdx + 1, 0, `import { apiFetch } from '${importPath}';`);
      content = lines.join('\n');
    }
  }

  // 3. Remove authHeader logic
  // remove import of authHeader (handles cases like: import { API_BASE_URL, authHeader } from ...)
  content = content.replace(/,\s*authHeader\b/g, '');
  content = content.replace(/\bauthHeader\s*,/g, '');
  // if it's the only thing imported
  content = content.replace(/import\s*{\s*authHeader\s*}\s*from\s*['"][^'"]+['"];?/g, '');
  
  // remove ...authHeader() usage in headers object
  content = content.replace(/\.\.\.authHeader\(\),?\s*/g, '');
  
  // Also remove direct Authorization headers that used user.token as requested
  // Example: 'Authorization': `Bearer ${user.token}`
  content = content.replace(/['"]Authorization['"]\s*:\s*`Bearer \${[^}]+}`\s*,?/g, '');

  // Note: some objects might end up with trailing commas or empty headers, but JS objects handle { } and { a: 1, } fine.
  // Fix empty headers objects like `headers: {  }` or `headers: { }`
  content = content.replace(/headers\s*:\s*{\s*}/g, '');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log(`Refactored ${f}`);
});
