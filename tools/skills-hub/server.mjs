#!/usr/bin/env node
/**
 * Org skills hub — small HTTP service so any machine/CLI can pull the shared catalog
 * or push proposal zips. Self-hosted (not Vercel): run on a reachable host or tailscale.
 *
 * Env:
 *   SKILLS_HUB_TOKEN (required) — Bearer token for all authenticated routes
 *   SKILLS_HUB_PORT (default 39871)
 *   SKILLS_HUB_HOST (default 127.0.0.1; use 0.0.0.0 for LAN/VPN)
 *   SKILLS_HUB_DATA (default ./.skills-hub-data) — catalog + proposals on disk
 *   SKILLS_HUB_SEED — optional path to a repo skills/ tree to seed data/skills on first start
 *   SKILLS_HUB_PUBLIC_READ=1 — allow GET /v1/catalog.json and /v1/catalog.zip without Bearer
 */

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import crypto from "crypto";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
const MAX_BODY = 32 * 1024 * 1024;
const PORT = Number(process.env.SKILLS_HUB_PORT || 39871);
const HOST = process.env.SKILLS_HUB_HOST || "127.0.0.1";
const TOKEN = process.env.SKILLS_HUB_TOKEN;
const DATA = path.resolve(process.env.SKILLS_HUB_DATA || path.join(process.cwd(), ".skills-hub-data"));
const PUBLIC_READ = process.env.SKILLS_HUB_PUBLIC_READ === "1";
const SEED = process.env.SKILLS_HUB_SEED ? path.resolve(process.env.SKILLS_HUB_SEED) : null;

/** Canonical tree on disk (same layout as repo ./skills/) */
const SKILLS_DIR = path.join(DATA, "skills");
const PROPOSALS = path.join(DATA, "proposals");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function skillsDirEmpty() {
  if (!fs.existsSync(SKILLS_DIR)) return true;
  return fs.readdirSync(SKILLS_DIR).length === 0;
}

function ensureDataDirs() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  fs.mkdirSync(PROPOSALS, { recursive: true });
  if (SEED && skillsDirEmpty() && fs.existsSync(SEED)) {
    copyDir(SEED, SKILLS_DIR);
    console.error("[skills-hub] Seeded skills from", SEED);
  }
}

function hasZip() {
  try {
    execFileSync("zip", ["-h"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Zip so archive root contains folder `skills/` (matches repo layout). */
function zipSkillsTree(outZip) {
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  execFileSync("zip", ["-r", outZip, "skills", "-x", "*.DS_Store"], { cwd: DATA, stdio: "inherit" });
}

function unzipTo(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync("unzip", ["-o", zipPath, "-d", destDir], { stdio: "inherit" });
}

function sha256File(p) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
}

function manifest() {
  const skills = [];
  if (!fs.existsSync(SKILLS_DIR)) return { skills: [], updatedAt: null };
  for (const ent of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!ent.isDirectory() || ent.name.startsWith("_")) continue;
    const md = path.join(SKILLS_DIR, ent.name, "SKILL.md");
    if (!fs.existsSync(md)) continue;
    const st = fs.statSync(md);
    skills.push({
      name: ent.name,
      skillMdMtime: st.mtime.toISOString(),
      skillMdSha256: sha256File(md),
    });
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: 1,
    skills,
    updatedAt: new Date().toISOString(),
  };
}

function readAuth(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7);
}

function allowRead(req) {
  if (PUBLIC_READ) return true;
  return TOKEN && readAuth(req) === TOKEN;
}

function allowWrite(req) {
  return TOKEN && readAuth(req) === TOKEN;
}

function collectBody(req, res, max = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > max) {
        res.writeHead(413);
        res.end("too large");
        reject(new Error("413"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "skills-hub", version: 1 }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/catalog.json") {
    if (!allowRead(req)) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(manifest(), null, 2));
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/catalog.zip") {
    if (!allowRead(req)) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    if (!hasZip()) {
      res.writeHead(500);
      res.end("zip CLI missing");
      return;
    }
    if (skillsDirEmpty()) {
      res.writeHead(404);
      res.end("catalog empty");
      return;
    }
    const tmp = path.join(DATA, `.catalog-${Date.now()}.zip`);
    try {
      zipSkillsTree(tmp);
      const buf = fs.readFileSync(tmp);
      res.writeHead(200, {
        "content-type": "application/zip",
        "content-length": buf.length,
      });
      res.end(buf);
    } finally {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/catalog") {
    if (!allowWrite(req)) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    if (!hasZip()) {
      res.writeHead(500);
      res.end("zip CLI missing");
      return;
    }
    try {
      const body = await collectBody(req, res);
      if (!Buffer.isBuffer(body) || body.length < 22) {
        res.writeHead(400);
        res.end("expected application/zip body");
        return;
      }
      const tmpZip = path.join(DATA, `.upload-${Date.now()}.zip`);
      const tmpExtract = path.join(DATA, `.extract-${Date.now()}`);
      fs.writeFileSync(tmpZip, body);
      fs.mkdirSync(tmpExtract, { recursive: true });
      unzipTo(tmpZip, tmpExtract);
      let extractRoot = tmpExtract;
      const top = fs.readdirSync(tmpExtract);
      if (top.length === 1 && top[0] === "skills") {
        extractRoot = path.join(tmpExtract, "skills");
      }
      let backup = null;
      if (fs.existsSync(SKILLS_DIR) && !skillsDirEmpty()) {
        backup = path.join(DATA, `.skills-backup-${Date.now()}`);
        fs.renameSync(SKILLS_DIR, backup);
      } else if (fs.existsSync(SKILLS_DIR)) {
        fs.rmSync(SKILLS_DIR, { recursive: true });
      }
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
      for (const name of fs.readdirSync(extractRoot)) {
        fs.renameSync(path.join(extractRoot, name), path.join(SKILLS_DIR, name));
      }
      fs.rmSync(tmpExtract, { recursive: true });
      fs.unlinkSync(tmpZip);
      if (backup) {
        try {
          fs.rmSync(backup, { recursive: true });
        } catch {
          /* ignore */
        }
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, manifest: manifest() }));
    } catch (e) {
      if (e.message === "413") return;
      console.error(e);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("publish failed");
      }
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/proposals") {
    if (!allowWrite(req)) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    try {
      const body = await collectBody(req, res);
      if (!Buffer.isBuffer(body) || body.length < 22) {
        res.writeHead(400);
        res.end("expected application/zip body");
        return;
      }
      const id = `${new Date().toISOString().replace(/[:.]/g, "-")}_${crypto.randomBytes(4).toString("hex")}`;
      const dir = path.join(PROPOSALS, id);
      fs.mkdirSync(dir, { recursive: true });
      const zipPath = path.join(dir, "skills.zip");
      fs.writeFileSync(zipPath, body);
      const meta = {
        id,
        receivedAt: new Date().toISOString(),
        host: req.headers["x-proposal-host"] || null,
        user: req.headers["x-proposal-user"] || null,
        message: req.headers["x-proposal-message"] || null,
        bytes: body.length,
      };
      fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(meta, null, 2));
      res.writeHead(201, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, proposalId: id }));
    } catch (e) {
      if (e.message !== "413") console.error(e);
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/v1/proposals") {
    if (!allowWrite(req)) {
      res.writeHead(401);
      res.end("unauthorized");
      return;
    }
    const list = fs.existsSync(PROPOSALS)
      ? fs.readdirSync(PROPOSALS).map((id) => {
          const m = path.join(PROPOSALS, id, "metadata.json");
          try {
            return JSON.parse(fs.readFileSync(m, "utf8"));
          } catch {
            return { id, error: "no metadata" };
          }
        })
      : [];
    list.sort((a, b) => (b.receivedAt || "").localeCompare(a.receivedAt || ""));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ proposals: list }, null, 2));
    return;
  }

  res.writeHead(404);
  res.end("not found");
}

function main() {
  if (!TOKEN) {
    console.error("Set SKILLS_HUB_TOKEN (shared secret for Bearer auth).");
    process.exit(1);
  }
  if (!hasZip()) {
    console.error("Install zip/unzip (macOS: preinstalled; Linux: apt install zip unzip).");
    process.exit(1);
  }
  ensureDataDirs();
  const server = http.createServer((req, res) => {
    handler(req, res).catch((e) => {
      console.error(e);
      if (!res.writableEnded) {
        res.writeHead(500);
        res.end("error");
      }
    });
  });
  server.listen(PORT, HOST, () => {
    console.error(
      `[skills-hub] http://${HOST}:${PORT}  data=${DATA}  publicRead=${PUBLIC_READ}`,
    );
  });
}

main();
