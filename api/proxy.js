// api/proxy.js
// AROMA SUNÉ CORS 代理 - 修复版

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbyZ8wnhJEvleygtaLcmq4HUglDXbZFIZ2MwD3YCLhY32idIdMFXCJa9TcE5Hmg8lJEkTA/exec";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-secret"
  );

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let url = BACKEND_URL;

    // 拼接 query（GET/POST 都允许带 query）
    const qIndex = req.url.indexOf("?");
    if (qIndex !== -1) {
      url += req.url.slice(qIndex);
    }

    const options = {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    };

    if (req.method === "POST") {
      options.body = JSON.stringify(req.body ?? {});
    } else if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const response = await fetch(url, options);

    // 兼容 GAS 有时不返回 JSON 的情况
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({
      status: "error",
      message: error?.message || String(error),
    });
  }
}
