#!/usr/bin/env node
/**
 * Headless skill-evolver: reads Cursor agent-transcripts + project .cursor/skills,
 * calls Anthropic Messages API, writes changelog; optionally applies SKILL.md updates.
 *
 * Env:
 *   ANTHROPIC_API_KEY (required) or load from ~/.config/coa-service/skill-evolution.env
 *   ANTHROPIC_MODEL (default claude-3-5-haiku-20241022)
 *   SKILL_EVOLUTION_APPLY=1 — write proposed SKILL.md files under .cursor/skills/<name>/
 *   SKILL_EVOLUTION_TRANSCRIPTS_DIR — override transcript root
 *   SKILL_EVOLUTION_MAX_TRANSCRIPTS (default 12)
 *   SKILL_EVOLUTION_CHARS_PER_TRANSCRIPT (default 14000)
 */

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnvFile(path.join(os.homedir(), ".config", "coa-service", "skill-evolution.env"));
loadDotEnvFile(path.join(REPO_ROOT, ".env.local"));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
const APPLY = process.env.SKILL_EVOLUTION_APPLY === "1";
const MAX_TRANSCRIPTS = Math.min(50, Math.max(1, Number(process.env.SKILL_EVOLUTION_MAX_TRANSCRIPTS || 12)));
const CHARS_PER = Math.min(200_000, Math.max(2000, Number(process.env.SKILL_EVOLUTION_CHARS_PER_TRANSCRIPT || 14000)));

function cursorTranscriptsDir() {
  if (process.env.SKILL_EVOLUTION_TRANSCRIPTS_DIR) {
    const d = path.resolve(process.env.SKILL_EVOLUTION_TRANSCRIPTS_DIR);
    if (fs.existsSync(d)) return d;
    console.error("SKILL_EVOLUTION_TRANSCRIPTS_DIR does not exist:", d);
    process.exit(1);
  }
  const segments = path.resolve(REPO_ROOT).split(path.sep).filter(Boolean);
  const slug = segments.join("-");
  const primary = path.join(os.homedir(), ".cursor", "projects", slug, "agent-transcripts");
  if (fs.existsSync(primary)) return primary;
  const projects = path.join(os.homedir(), ".cursor", "projects");
  if (!fs.existsSync(projects)) return null;
  const base = path.basename(REPO_ROOT);
  for (const name of fs.readdirSync(projects)) {
    const at = path.join(projects, name, "agent-transcripts");
    if (!fs.existsSync(at)) continue;
    if (name.includes(base.replace(/\s+/g, "-"))) return at;
  }
  const first = fs
    .readdirSync(projects)
    .map((n) => path.join(projects, n, "agent-transcripts"))
    .find((p) => fs.existsSync(p));
  return first || null;
}

function listSessionTranscripts(root) {
  const out = [];
  const cutoff = Date.now() - 30 * 864e5;
  for (const uuid of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const p = path.join(root, uuid.name, `${uuid.name}.jsonl`);
    if (!fs.existsSync(p)) continue;
    const st = fs.statSync(p);
    if (st.mtimeMs < cutoff) continue;
    out.push({ path: p, mtime: st.mtimeMs });
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out.slice(0, MAX_TRANSCRIPTS);
}

function readSkillSnippets() {
  const skillsRoot = path.join(REPO_ROOT, ".cursor", "skills");
  if (!fs.existsSync(skillsRoot)) return [];
  const out = [];
  for (const name of fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const md = path.join(skillsRoot, name.name, "SKILL.md");
    if (!fs.existsSync(md)) continue;
    let text = fs.readFileSync(md, "utf8");
    if (text.length > 24_000) text = text.slice(0, 24_000) + "\n\n[truncated for API]\n";
    out.push({ dir: name.name, path: md, content: text });
  }
  return out;
}

function extractJsonObject(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

async function callAnthropic(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16_384,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }
  const data = await res.json();
  const block = data.content?.find((c) => c.type === "text");
  return block?.text || "";
}

function safeSkillDir(name) {
  return typeof name === "string" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(name);
}

async function main() {
  if (!API_KEY) {
    console.error(
      "Missing ANTHROPIC_API_KEY. Set it in the environment, or in ~/.config/coa-service/skill-evolution.env",
    );
    process.exit(1);
  }

  const transcriptsRoot = cursorTranscriptsDir();
  if (!transcriptsRoot) {
    console.error("Could not find Cursor agent-transcripts directory under ~/.cursor/projects/");
    process.exit(1);
  }

  const sessions = listSessionTranscripts(transcriptsRoot);
  const skills = readSkillSnippets();

  let transcriptBundle = "";
  for (const s of sessions) {
    let body = fs.readFileSync(s.path, "utf8");
    if (body.length > CHARS_PER) body = body.slice(0, CHARS_PER) + "\n\n[truncated]\n";
    transcriptBundle += `\n\n### FILE: ${s.path}\n${body}`;
  }

  const skillsBundle = skills
    .map((s) => `\n\n### SKILL ${s.dir} (${path.relative(REPO_ROOT, s.path)})\n${s.content}`)
    .join("");

  const system = `You are the automated "skill-evolver" for a Cursor project. Analyze agent transcripts (JSONL-style lines with user/assistant messages) and the provided SKILL.md files.

Output a single JSON object (no markdown outside JSON) with this shape:
{
  "changelogMarkdown": "full markdown report following the skill-evolver template: Summary, Changes by skill, Gaps, Not actioned",
  "skillUpdates": [
    { "skillDir": "lowercase-hyphen-name", "fullMarkdown": "complete new SKILL.md file content including YAML frontmatter" }
  ]
}

Rules:
- Only include skillUpdates when you have a concrete, safe improvement. Prefer fewer, high-quality updates.
- skillDir must match an existing skill folder name from the input list. Do not invent new skill names unless absolutely necessary for a new skill (avoid creating new skills here).
- fullMarkdown must be valid SKILL.md with --- frontmatter (name + description).
- If nothing should change, use skillUpdates: [].
- Be concise in changelog; actionable in proposed SKILL bodies.`;

  const user = `## Transcripts (recent sessions, possibly truncated)\n${transcriptBundle || "(none in range)"}\n\n## Current project skills\n${skillsBundle || "(none)"}\n\nRespond with JSON only.`;

  console.error(`Using transcripts: ${transcriptsRoot} (${sessions.length} files), model: ${MODEL}, apply: ${APPLY}`);

  const raw = await callAnthropic(system, user);
  let parsed;
  try {
    parsed = extractJsonObject(raw);
  } catch (e) {
    console.error("Failed to parse model JSON. Raw output saved to stderr snippet:\n", raw.slice(0, 2000));
    throw e;
  }

  const changelog = parsed.changelogMarkdown || "# Skill evolution\n\n(no changelogMarkdown in response)";
  const updates = Array.isArray(parsed.skillUpdates) ? parsed.skillUpdates : [];

  const day = new Date().toISOString().slice(0, 10);
  const outDir = path.join(REPO_ROOT, "docs", "dev", "skill-evolution", `run-${day}`);
  fs.mkdirSync(outDir, { recursive: true });
  const changelogPath = path.join(outDir, "changelog.md");
  fs.writeFileSync(changelogPath, changelog, "utf8");
  console.error("Wrote", changelogPath);

  let applied = 0;
  for (const u of updates) {
    const dir = u.skillDir;
    const md = u.fullMarkdown;
    if (!safeSkillDir(dir) || typeof md !== "string" || md.length < 50) continue;
    if (!md.includes("---")) continue;
    const target = path.join(REPO_ROOT, ".cursor", "skills", dir, "SKILL.md");
    const proposedPath = path.join(outDir, "proposed", dir, "SKILL.md");
    fs.mkdirSync(path.dirname(proposedPath), { recursive: true });
    fs.writeFileSync(proposedPath, md, "utf8");
    const skillDirPath = path.join(REPO_ROOT, ".cursor", "skills", dir);
    if (APPLY && fs.existsSync(skillDirPath)) {
      fs.writeFileSync(target, md, "utf8");
      applied += 1;
      console.error("Applied", target);
    }
  }

  if (!APPLY && updates.length) {
    console.error(`Proposed ${updates.length} update(s) under ${path.join(outDir, "proposed")}; set SKILL_EVOLUTION_APPLY=1 to write live .cursor/skills.`);
  }

  console.log(JSON.stringify({ changelogPath, proposedDir: path.join(outDir, "proposed"), applied, transcripts: sessions.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
