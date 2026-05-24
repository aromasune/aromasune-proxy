const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbx6yrDYJ9G1nYI0NPvaacdjWGDQVu91WGCR0yBO0OtZn0INK1kibEM_AJDxesMPcVgx_Q/exec';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 将查询参数拼接到后端 URL
    let backendUrl = BACKEND_URL;
    if (req.url) {
      backendUrl += req.url;  // 保留 ?action=sendCode&phone=xxx
    }
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}