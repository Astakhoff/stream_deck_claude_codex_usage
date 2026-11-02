import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = "com.local.claude-desktop-week.sdPlugin";
const plugin = path.join(root, name);
const dist = path.join(root, "dist");
const stage = path.join(dist, ".zip-stage");
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${path.basename(command)} exited with ${result.status}`);
}
await fs.access(path.join(plugin, "node_modules/ws/package.json"));
await fs.mkdir(dist, { recursive: true });
run(path.join(root, "node_modules/.bin/streamdeck"), [
  "pack",
  name,
  "--output",
  "dist",
  "--force",
  "--no-file-list",
]);
await fs.rm(stage, { recursive: true, force: true });
try {
  await fs.mkdir(stage);
  await fs.cp(plugin, path.join(stage, name), {
    recursive: true,
    filter: (source) =>
      !["status.json", ".DS_Store", "tests", ".sdignore"].includes(
        path.basename(source),
      ) && !source.endsWith(".log"),
  });
  await fs.copyFile(path.join(root, "LICENSE"), path.join(stage, "LICENSE"));
  await fs.copyFile(
    path.join(root, "docs/INSTALLATION.md"),
    path.join(stage, "INSTALLATION.md"),
  );
  const { version } = JSON.parse(
    await fs.readFile(path.join(root, "package.json"), "utf8"),
  );
  const filename = `stream-deck-claude-desktop-v${version}.zip`;
  await fs.rm(path.join(dist, filename), { force: true });
  run(
    "zip",
    ["-q", "-r", path.join(dist, filename), name, "LICENSE", "INSTALLATION.md"],
    stage,
  );
  console.log(`Release files are available in ${dist}`);
} finally {
  await fs.rm(stage, { recursive: true, force: true });
}
