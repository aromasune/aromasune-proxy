// api/proxy.js
// AROMA SUNÉ CORS 代理 - 修复版

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyZ8wnhJEvleygtaLcmq4HUglDXbZFIZ2MwD3YCLhY32idIdMFXCJa9TcE5Hmg8lJEkTA/exec';

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    let url = BACKEND_URL;
    let options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // 处理 GET 请求（带参数）
    if (req.method === 'GET') {
      const queryParams = new URLSearchParams(req.url.split('?')[1]).toString();
      if (queryParams) {
        url += '?' + queryParams;
      }
      const response = await fetch(url, options);
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    // 处理 POST 请求
    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
      const response = await fetch(url, options);
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
}
