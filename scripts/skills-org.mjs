#!/usr/bin/env node
/**
 * Org CLI — pull/publish catalog from a skills-hub, push proposals.
 *
 * Env (or flags):
 *   SKILLS_HUB_URL — e.g. http://10.0.0.5:39871
 *   SKILLS_HUB_TOKEN — Bearer secret (same as server)
 *   SKILLS_REPO_ROOT — default cwd
 *
 * Usage:
 *   node scripts/skills-org.mjs pull
 *   node scripts/skills-org.mjs publish
 *   node scripts/skills-org.mjs push-proposal --message "SEO tweaks from team B"
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const REPO = process.env.SKILLS_REPO_ROOT
  ? path.resolve(process.env.SKILLS_REPO_ROOT)
  : path.resolve(__dirname, "..");
loadDotEnvFile(path.join(REPO, ".env.local"));
loadDotEnvFile(path.join(REPO, "tools", "skills-hub", ".env"));

function hasZip() {
  try {
    execFileSync("zip", ["-h"], { stdio: "ignore" });
    execFileSync("unzip", ["-h"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function zipSkillsDir(outZip) {
  const skillsDir = path.join(REPO, "skills");
  if (!fs.existsSync(skillsDir)) {
    console.error("Missing", skillsDir);
    process.exit(1);
  }
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  execFileSync("zip", ["-r", outZip, "skills", "-x", "*.DS_Store"], { cwd: REPO, stdio: "inherit" });
}

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--message" && argv[i + 1]) {
      out.flags.message = argv[++i];
    } else if (a.startsWith("--url=")) {
      out.flags.url = a.slice(6);
    } else if (a === "--url" && argv[i + 1]) {
      out.flags.url = argv[++i];
    } else if (!a.startsWith("-")) out._.push(a);
  }
  return out;
}

async function hubFetch(urlPath, { method = "GET", body, headers = {} } = {}) {
  const base = process.env.SKILLS_HUB_URL || "";
  if (!base) {
    console.error("Set SKILLS_HUB_URL (e.g. http://127.0.0.1:39871)");
    process.exit(1);
  }
  const token = process.env.SKILLS_HUB_TOKEN;
  const publicPath =
    urlPath === "/health" ||
    (process.env.SKILLS_HUB_PUBLIC_READ === "1" &&
      (urlPath === "/v1/catalog.json" || urlPath === "/v1/catalog.zip"));
  if (!token && !publicPath) {
    console.error(
      "Set SKILLS_HUB_TOKEN (or set SKILLS_HUB_PUBLIC_READ=1 here if the hub allows anonymous catalog pulls)",
    );
    process.exit(1);
  }
  const url = `${base.replace(/\/$/, "")}${urlPath}`;
  const h = { ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  const res = await fetch(url, { method, headers: h, body });
  return res;
}

async function cmdPull() {
  if (!hasZip()) {
    console.error("Need zip and unzip on PATH");
    process.exit(1);
  }
  const res = await hubFetch("/v1/catalog.zip");
  if (res.status === 404) {
    console.error("Hub catalog empty — ask admin to publish first.");
    process.exit(1);
  }
  if (!res.ok) {
    console.error("pull failed", res.status, await res.text());
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `skills-pull-${Date.now()}.zip`);
  fs.writeFileSync(tmp, buf);
  const skillsDir = path.join(REPO, "skills");
  const backup = path.join(REPO, `.skills-backup-${Date.now()}`);
  if (fs.existsSync(skillsDir)) {
    fs.renameSync(skillsDir, backup);
  }
  try {
    execFileSync("unzip", ["-o", tmp, "-d", REPO], { stdio: "inherit" });
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    if (fs.existsSync(backup)) {
      fs.rmSync(backup, { recursive: true });
    }
    console.error("Pulled catalog into", skillsDir);
    console.error("Run: npm run skills:sync");
  } catch (e) {
    console.error(e);
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    if (fs.existsSync(skillsDir)) {
      fs.rmSync(skillsDir, { recursive: true });
    }
    if (fs.existsSync(backup)) {
      fs.renameSync(backup, skillsDir);
    }
    process.exit(1);
  }
}

async function cmdPublish() {
  if (!hasZip()) {
    console.error("Need zip and unzip on PATH");
    process.exit(1);
  }
  const skillsDir = path.join(REPO, "skills");
  if (!fs.existsSync(skillsDir)) {
    console.error("Missing", skillsDir);
    process.exit(1);
  }
  const tmp = path.join(os.tmpdir(), `skills-publish-${Date.now()}.zip`);
  execFileSync("zip", ["-r", tmp, "skills", "-x", "*.DS_Store"], { cwd: REPO, stdio: "inherit" });
  const body = fs.readFileSync(tmp);
  const res = await hubFetch("/v1/catalog", {
    method: "POST",
    body,
    headers: { "content-type": "application/zip", "content-length": String(body.length) },
  });
  fs.unlinkSync(tmp);
  const text = await res.text();
  if (!res.ok) {
    console.error("publish failed", res.status, text);
    process.exit(1);
  }
  console.log(text);
}

async function cmdPushProposal(flags) {
  if (!hasZip()) {
    console.error("Need zip and unzip on PATH");
    process.exit(1);
  }
  const tmp = path.join(os.tmpdir(), `skills-proposal-${Date.now()}.zip`);
  zipSkillsDir(tmp);
  const body = fs.readFileSync(tmp);
  const res = await hubFetch("/v1/proposals", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/zip",
      "content-length": String(body.length),
      "x-proposal-host": os.hostname(),
      "x-proposal-user": process.env.USER || process.env.USERNAME || "",
      "x-proposal-message": flags.message || "",
    },
  });
  fs.unlinkSync(tmp);
  const text = await res.text();
  if (!res.ok) {
    console.error("push-proposal failed", res.status, text);
    process.exit(1);
  }
  console.log(text);
}

async function cmdManifest() {
  const res = await hubFetch("/v1/catalog.json");
  console.log(await res.text());
}

async function cmdPing() {
  const base = process.env.SKILLS_HUB_URL || "";
  if (!base) {
    console.error("Set SKILLS_HUB_URL");
    process.exit(1);
  }
  const res = await fetch(`${base.replace(/\/$/, "")}/health`);
  console.log(res.status, await res.text());
}

function main() {
  const { _, flags } = parseArgs(process.argv);
  const cmd = _[0];
  if (flags.url) process.env.SKILLS_HUB_URL = flags.url;

  const run = async () => {
    if (cmd === "pull") await cmdPull();
    else if (cmd === "publish") await cmdPublish();
    else if (cmd === "push-proposal") await cmdPushProposal(flags);
    else if (cmd === "manifest") await cmdManifest();
    else if (cmd === "ping") await cmdPing();
    else {
      console.error(
        `Usage: node scripts/skills-org.mjs pull|publish|push-proposal|manifest|ping [--url URL] [--message "…"]`,
      );
      process.exit(1);
    }
  };
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
