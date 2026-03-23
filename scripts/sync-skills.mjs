#!/usr/bin/env node
/**
 * Canonical skills live in ./skills/<name>/ (SKILL.md + optional references/).
 * Sync to Cursor (.cursor/skills) and pack Claude .skill zips (zip CLI).
 *
 * Usage:
 *   node scripts/sync-skills.mjs to-cursor
 *   node scripts/sync-skills.mjs from-cursor
 *   node scripts/sync-skills.mjs pack [name|all]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const SKILLS = path.join(REPO, "skills");
const CURSOR = path.join(REPO, ".cursor", "skills");
const ARTIFACTS = path.join(REPO, "artifacts", "claude-skills");

function loadManifest() {
  const p = path.join(SKILLS, "_sync-manifest.json");
  if (!fs.existsSync(p)) return { cursorExports: {} };
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function listCanonicalSkillDirs() {
  if (!fs.existsSync(SKILLS)) return [];
  return fs
    .readdirSync(SKILLS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function syncToCursor() {
  const manifest = loadManifest();
  const exports = manifest.cursorExports || {};
  fs.mkdirSync(CURSOR, { recursive: true });
  for (const name of listCanonicalSkillDirs()) {
    const src = path.join(SKILLS, name);
    const override = exports[name];
    if (override?.type === "file") {
      const skillMd = path.join(src, "SKILL.md");
      if (!fs.existsSync(skillMd)) {
        console.warn("Skip (no SKILL.md):", name);
        continue;
      }
      const destFile = path.join(CURSOR, override.filename || `${name}.md`);
      fs.copyFileSync(skillMd, destFile);
      console.log("cursor file", path.relative(REPO, destFile));
      continue;
    }
    const dest = path.join(CURSOR, name);
    copyDirRecursive(src, dest);
    console.log("cursor dir ", path.relative(REPO, dest));
  }
}

function syncFromCursor() {
  const manifest = loadManifest();
  const exports = manifest.cursorExports || {};
  fs.mkdirSync(SKILLS, { recursive: true });
  const entries = fs.readdirSync(CURSOR, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(CURSOR, ent.name);
    if (ent.isFile() && ent.name.endsWith(".md")) {
      const base = ent.name.replace(/\.md$/, "");
      const fileMapped = Object.entries(exports).find(
        ([, v]) => v?.type === "file" && v.filename === ent.name,
      );
      const dirName = fileMapped ? fileMapped[0] : base;
      const destDir = path.join(SKILLS, dirName);
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(p, path.join(destDir, "SKILL.md"));
      console.log("from cursor file → skills/", dirName);
      continue;
    }
    if (!ent.isDirectory()) continue;
    if (ent.name.startsWith(".")) continue;
    const dest = path.join(SKILLS, ent.name);
    copyDirRecursive(p, dest);
    console.log("from cursor dir  → skills/", ent.name);
  }
}

function hasZipCli() {
  try {
    execFileSync("zip", ["-h"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function packSkill(name) {
  if (!hasZipCli()) {
    console.error("Install zip (e.g. brew install zip) or use macOS /usr/bin/zip.");
    process.exit(1);
  }
  const srcDir = path.join(SKILLS, name);
  if (!fs.existsSync(path.join(srcDir, "SKILL.md"))) {
    console.error("No skills/%s/SKILL.md", name);
    process.exit(1);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const out = path.join(ARTIFACTS, `${name}.skill`);
  if (fs.existsSync(out)) fs.unlinkSync(out);
  execFileSync("zip", ["-r", out, name, "-x", "*.DS_Store"], {
    cwd: SKILLS,
    stdio: "inherit",
  });
  console.log("Wrote", path.relative(REPO, out));
}

function packAll() {
  for (const name of listCanonicalSkillDirs()) packSkill(name);
}

function main() {
  const cmd = process.argv[2];
  const arg = process.argv[3];
  if (cmd === "to-cursor") {
    syncToCursor();
  } else if (cmd === "from-cursor") {
    syncFromCursor();
  } else if (cmd === "pack") {
    if (!arg || arg === "all") packAll();
    else packSkill(arg);
  } else {
    console.error(`Usage: node scripts/sync-skills.mjs to-cursor|from-cursor|pack [name|all]`);
    process.exit(1);
  }
}

const entry = path.resolve(process.argv[1] || "");
const isMain =
  import.meta.url === pathToFileURL(entry).href ||
  import.meta.url.replace("file://", "") === entry;
if (isMain) {
  main();
}
