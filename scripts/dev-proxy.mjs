import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import { request as httpRequest } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const ENV_FILE = path.join(ROOT, ".env.local");
const PORT = Number(process.env.PROXY_PORT ?? 8080);
const EVE_PORT = Number(process.env.EVE_PORT ?? 3000);
const SPAWN_EVE = process.env.SPAWN_EVE !== "0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

let eveChild = null;
let eveReady = false;
let restarting = false;

function loadEnvFile() {
  let text = "";
  try {
    text = fs.readFileSync(ENV_FILE, "utf8");
  } catch {
    return {};
  }
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function hasXaiKey() {
  return Boolean(process.env.XAI_API_KEY || loadEnvFile().XAI_API_KEY);
}

function upsertEnv(key, value) {
  let text = "";
  try {
    text = fs.readFileSync(ENV_FILE, "utf8");
  } catch {
    text = "";
  }
  const line = `${key}=${JSON.stringify(value)}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) text = text.replace(re, line);
  else text = `${text.trimEnd()}${text.trim() ? "\n" : ""}${line}\n`;
  fs.writeFileSync(ENV_FILE, text.endsWith("\n") ? text : `${text}\n`, { mode: 0o600 });
}

function waitForEve(timeoutMs = 60_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = httpRequest(
        { hostname: "127.0.0.1", port: EVE_PORT, path: "/eve/v1/health", method: "GET", timeout: 1500 },
        (res) => {
          res.resume();
          if ((res.statusCode ?? 500) < 500) {
            eveReady = true;
            resolve(true);
            return;
          }
          retry();
        },
      );
      req.on("error", retry);
      req.on("timeout", () => {
        req.destroy();
        retry();
      });
      req.end();
    };
    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Eve не поднялся на порту " + EVE_PORT));
        return;
      }
      setTimeout(tick, 800);
    };
    tick();
  });
}

function stopEve() {
  return new Promise((resolve) => {
    if (!eveChild || eveChild.killed) {
      eveChild = null;
      eveReady = false;
      resolve();
      return;
    }
    const child = eveChild;
    eveChild = null;
    eveReady = false;
    const done = () => resolve();
    child.once("exit", done);
    child.kill("SIGTERM");
    setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // already gone
      }
    }, 4000);
  });
}

function startEve() {
  const fileEnv = loadEnvFile();
  if (fileEnv.XAI_API_KEY) process.env.XAI_API_KEY = fileEnv.XAI_API_KEY;
  const env = {
    ...process.env,
    ...fileEnv,
    EVE_PUBLIC_CHAT: "1",
    PORT: String(EVE_PORT),
  };
  eveReady = false;
  eveChild = spawn("pnpm", ["exec", "eve", "dev", "--no-ui", "--port", String(EVE_PORT), "--host", "127.0.0.1"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "inherit", "inherit"],
  });
  eveChild.on("exit", (code, signal) => {
    if (eveChild) {
      console.error(`eve exited code=${code} signal=${signal}`);
      eveChild = null;
      eveReady = false;
    }
  });
  return waitForEve();
}

async function restartEve() {
  if (restarting) return;
  restarting = true;
  try {
    await stopEve();
    await startEve();
  } finally {
    restarting = false;
  }
}

function proxyEve(req, res) {
  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: EVE_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${EVE_PORT}` },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.statusCode = 502;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Агент Eve не запущен. Подождите несколько секунд и обновите страницу.");
  });
  req.pipe(upstream);
}

function serveSite(req, res) {
  const url = new URL(req.url ?? "/", "http://local");
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/") filePath = "/index.html";
  if (filePath === "/agent" || filePath === "/agent/") filePath = "/agent.html";
  const full = path.normalize(path.join(SITE, filePath));
  if (!full.startsWith(SITE)) {
    res.statusCode = 403;
    res.end("forbidden");
    return;
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("not found");
      return;
    }
    res.setHeader("content-type", MIME[path.extname(full)] ?? "application/octet-stream");
    res.end(data);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const pathname = req.url?.split("?")[0] ?? "/";

  if (pathname === "/api/status" && req.method === "GET") {
    sendJson(res, 200, {
      eveReady,
      hasXaiKey: hasXaiKey(),
      model: "grok-4.6",
      provider: "xai",
    });
    return;
  }

  if (pathname === "/api/xai-key" && req.method === "POST") {
    try {
      const body = await readJson(req);
      const apiKey = String(body.apiKey || body.key || "").trim();
      if (!apiKey || apiKey.length < 8) {
        sendJson(res, 400, { ok: false, error: "Вставьте ключ xAI (XAI_API_KEY)." });
        return;
      }
      upsertEnv("XAI_API_KEY", apiKey);
      process.env.XAI_API_KEY = apiKey;
      if (SPAWN_EVE) {
        try {
          await restartEve();
        } catch (err) {
          sendJson(res, 503, { ok: false, error: String(err.message || err) });
          return;
        }
      }
      sendJson(res, 200, { ok: true, eveReady, hasXaiKey: true });
    } catch {
      sendJson(res, 400, { ok: false, error: "Не удалось прочитать ключ." });
    }
    return;
  }

  if (pathname.startsWith("/eve/") || pathname.startsWith("/.well-known/")) {
    proxyEve(req, res);
    return;
  }
  serveSite(req, res);
});

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`KP agent UI http://127.0.0.1:${PORT}/agent`);
  if (!SPAWN_EVE) return;
  try {
    await startEve();
    console.log(`Eve ready on 127.0.0.1:${EVE_PORT}`);
  } catch (err) {
    console.error(err);
  }
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await stopEve();
    process.exit(0);
  });
}
