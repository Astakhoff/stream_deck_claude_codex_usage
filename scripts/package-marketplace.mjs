import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'com.local.claude-desktop-week.sdPlugin');
const uuid = 'com.astakhoff.claude-codex-weekly-usage';
const dist = path.join(root, 'dist/marketplace');
const stage = path.join(dist, '.stage');
const plugin = path.join(stage, uuid + '.sdPlugin');
await fs.mkdir(dist, { recursive: true });
await fs.rm(stage, { recursive: true, force: true });
try {
  await fs.cp(source, plugin, { recursive: true, filter: (file) =>
    !['tests', 'status.json', 'auth.json', '.DS_Store'].includes(path.basename(file)) &&
    !file.endsWith('.log') && !file.endsWith('.credentials.json') && !path.basename(file).startsWith('.env')
  });
  const manifest = JSON.parse(await fs.readFile(path.join(plugin, 'manifest.json'), 'utf8'));
  const previous = manifest.UUID;
  manifest.UUID = uuid;
  manifest.SDKVersion = 3;
  manifest.Software.MinimumVersion = "6.9";
  manifest.CodePath = "bin/marketplace-plugin.mjs";
  for (const action of manifest.Actions) action.UUID = uuid + action.UUID.slice(previous.length);
  await fs.writeFile(path.join(plugin, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const result = spawnSync(path.join(root, 'node_modules/.bin/streamdeck'), ['pack', plugin, '--output', dist, '--force', '--no-file-list'], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status) throw new Error('Marketplace package failed validation');
  console.log('Marketplace installer: ' + path.join(dist, uuid + '.streamDeckPlugin'));
} finally {
  await fs.rm(stage, { recursive: true, force: true });
}
