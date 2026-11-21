const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { generate } = require("./api/generate.js");

const ENV_FILE = path.join(__dirname, ".env.local");
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname);
  const file = path.join(PUBLIC_DIR, relative);
  if (!file.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { error: "접근할 수 없습니다" });

  fs.readFile(file, (error, data) => {
    if (error) return sendJson(res, 404, { error: "파일을 찾을 수 없습니다" });
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/generate") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", async () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return sendJson(res, 400, { error: "JSON 형식이 아닙니다" });
      }
      const result = await generate(body);
      sendJson(res, result.status, result.body);
    });
    return;
  }

  if (req.url === "/api/generate") return sendJson(res, 405, { error: "지원하지 않는 요청입니다" });
  if (req.method === "GET") return serveStatic(req, res);
  sendJson(res, 405, { error: "지원하지 않는 요청입니다" });
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
