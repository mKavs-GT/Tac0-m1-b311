import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  { from: 'bg-[#f9f9fb]', to: 'bg-bg-root' },
  { from: 'bg-white', to: 'bg-bg-surface' },
  { from: 'bg-[#f3f4f6]', to: 'bg-bg-muted' },
  { from: 'text-[#1a1a1b]', to: 'text-text-main' },
  { from: 'text-[#6a737d]', to: 'text-text-muted' },
  { from: 'border-[#e1e4e8]', to: 'border-border-main' },
  { from: 'border-[#f3f4f6]', to: 'border-bg-muted' },
  { from: 'hover:bg-[#f9f9fb]', to: 'hover:bg-bg-root' },
  { from: 'hover:bg-white', to: 'hover:bg-bg-surface' },
  { from: 'hover:bg-[#f3f4f6]', to: 'hover:bg-bg-muted' },
  { from: 'hover:text-[#1a1a1b]', to: 'hover:text-text-main' },
  { from: 'hover:text-[#6a737d]', to: 'hover:text-text-muted' },
  { from: 'hover:border-[#e1e4e8]', to: 'hover:border-border-main' },
  { from: 'group-hover:text-[#1a1a1b]', to: 'group-hover:text-text-main' },
  { from: 'group-hover:border-[#e1e4e8]', to: 'group-hover:border-border-main' },
  { from: 'group-hover:bg-white', to: 'group-hover:bg-bg-surface' },
];

for (const { from, to } of replacements) {
  content = content.split(from).join(to);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.jsx updated with exact string replacements using ESM.');
