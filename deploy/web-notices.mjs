// Include the licence texts provided by installed runtime packages with the offline web bundle.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const client = fileURLToPath(new URL('../client/', import.meta.url));
const lock = JSON.parse(readFileSync(join(client, 'package-lock.json'), 'utf8'));
const notices = [];
for (const [relative, pkg] of Object.entries(lock.packages)) {
  if (!relative || pkg.dev) continue;
  const path = resolve(client, relative);
  let files;
  try { files = readdirSync(path, { withFileTypes: true }); }
  catch { continue; } // Optional platform packages can be absent.
  const entries = files.filter(f => f.isFile() && /^(licen[cs]e|notice|copying)([._-]|$)/i.test(f.name));
  notices.push(relative + ' ' + pkg.version + ' (' + (pkg.license ?? 'see package') + ')');
  for (const f of entries) notices.push(readFileSync(join(path, f.name), 'utf8'));
}
const out = join(process.argv[2] ?? join(client, 'dist'), 'licences');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'web-packages.txt'), notices.join('\n\n') + '\n');
