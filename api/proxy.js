下面是一份可完整替换的 api/proxy.js（Vercel Serverless Function / Node.js）。特点：

仅允许 POST

统一包装成 { token, data } 发给 GAS

用 GAS 返回的 status 设置真实 HTTP 状态码

处理超时（AbortController）

可选 CORS（默认开启，便于浏览器直连；如只从同域调用也可关掉）

不在日志里打印密钥

把下面文件保存为：/api/proxy.js

// /api/proxy.js
// Vercel Serverless Function (Node.js)
// Env required:
//   GAS_URL      = your GAS Web App exec URL
//   API_SECRET   = shared secret (must match GAS CONFIG.SHARED_SECRET)

const DEFAULT_TIMEOUT_MS = 15000;
const ENABLE_CORS = true;

// If you want to lock down origins, replace with your exact domains.
// e.g. new Set(["https://www.aromasune.com", "https://aromasune.com"])
const ALLOWED_ORIGINS = null; // null = allow all (when ENABLE_CORS=true)

function setCors(res, origin) {
  if (!ENABLE_CORS) return;

  if (ALLOWED_ORIGINS && origin && !ALLOWED_ORIGINS.has(origin)) {
    // If origin not allowed, don't set CORS headers.
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;

  // CORS preflight
  if (req.method === "OPTIONS") {
    setCors(res, origin);
    return res.status(204).end();
  }

  setCors(res, origin);

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      status: 405,
      error: "Method Not Allowed",
      allowed: ["POST"],
    });
  }

  const GAS_URL = process.env.GAS_URL;
  const API_SECRET = process.env.API_SECRET;

  if (!GAS_URL) {
    return res.status(500).json({
      ok: false,
      status: 500,
      error: "Missing env GAS_URL",
    });
  }
  if (!API_SECRET) {
    return res.status(500).json({
      ok: false,
      status: 500,
      error: "Missing env API_SECRET",
    });
  }

  // req.body should already be parsed by Vercel (when Content-Type: application/json)
  const data = req.body && typeof req.body === "object" ? req.body : {};

  const payload = {
    token: API_SECRET,
    data,
  };

  // Timeout / AbortController
  const timeoutMs = Number(process.env.PROXY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await r.text();

    // GAS should return JSON; but guard anyway
    let out;
    try {
      out = text ? JSON.parse(text) : {};
    } catch (e) {
      out = {
        ok: false,
        status: 502,
        error: "Bad JSON from GAS",
        detail: String(e),
        raw: text?.slice(0, 2000),
      };
    }

    // IMPORTANT: use out.status as the actual HTTP status
    const status = (out && typeof out.status === "number") ? out.status : (r.status || 200);
    return res.status(status).json(out);

  } catch (err) {
    const isAbort =
      err && (err.name === "AbortError" || String(err).includes("aborted"));

    const out = {
      ok: false,
      status: isAbort ? 504 : 502,
      error: isAbort ? "Upstream timeout" : "Upstream error",
      detail: String(err),
    };
    return res.status(out.status).json(out);

  } finally {
    clearTimeout(timeout);
  }
};

部署要点（你已经知道但这里给最短核对）：

Vercel 环境变量：

GAS_URL = https://script.google.com/macros/s/.../exec

API_SECRET = 与 GAS CONFIG.SHARED_SECRET 完全一致

（可选）PROXY_TIMEOUT_MS = 15000 / 20000

这份 proxy.js 会把前端传来的 JSON 原样放在 data 下发给 GAS，并把 GAS 返回的 status 变成真实 HTTP status。
