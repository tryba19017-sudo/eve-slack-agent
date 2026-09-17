import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { request as httpRequest } from "node:http";

const SITE = path.resolve("site");
const PORT = Number(process.env.PROXY_PORT ?? 8080);

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

function proxyEve(req, res) {
  const upstream = httpRequest(
    {
      hostname: "127.0.0.1",
      port: 3000,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: "127.0.0.1:3000" },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.statusCode = 502;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Агент Eve не запущен на порту 3000.");
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

const server = http.createServer((req, res) => {
  const pathname = req.url?.split("?")[0] ?? "/";
  if (pathname.startsWith("/eve/") || pathname.startsWith("/.well-known/")) {
    proxyEve(req, res);
    return;
  }
  serveSite(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`KP agent UI http://127.0.0.1:${PORT}/agent`);
});
