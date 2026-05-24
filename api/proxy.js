export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxFUlBNSlG1OBNQpA4FlHP9K592KktTjunuO-TbifYKzZJR1yR0Xe4XhtYR7iBg9FmxOg/exec';
  
  try {
    // 获取请求体
    let body = null;
    if (req.method === 'POST') {
      body = req.body;
    }
    
    // 构建转发请求
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // 转发到 Google Apps Script
    const response = await fetch(BACKEND_URL, fetchOptions);
    const data = await response.json();
    
    // 返回响应
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
}
