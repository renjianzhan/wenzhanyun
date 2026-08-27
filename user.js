// user.js - 用户注册、登录、信息获取
export async function handleUserAPI(path, method, request, env) {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };

  // 注册
  if (path === '/api/user/register' && method === 'POST') {
    try {
      const { username, password } = await request.json();
      if (!username || !password) return new Response(JSON.stringify({ error: "用户名密码必填" }), { status: 400, headers: corsHeaders });

      // 检查是否已存在
      const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
      if (existing) return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 409, headers: corsHeaders });

      // 获取IP
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

      // 存入数据库
      await env.DB.prepare("INSERT INTO users (username, password, ip) VALUES (?, ?, ?)").bind(username, password, ip).run();

      // GitHub 建文件夹
      const gitReq = await fetch(`https://api.github.com/repos/renjianzhan/wenzhanyun/contents/users/${username}/.gitkeep`, {
        method: "PUT",
        headers: { "Authorization": `token ${env.GH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Init folder for ${username}`, content: "", branch: "main" })
      });
      if (!gitReq.ok && gitReq.status !== 422) throw new Error("GitHub创建文件夹失败");

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
  }

  // 登录
  if (path === '/api/user/login' && method === 'POST') {
    try {
      const { username, password } = await request.json();
      const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).first();
      if (user) {
        // 更新IP
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        await env.DB.prepare("UPDATE users SET ip = ? WHERE id = ?").bind(ip, user.id).run();
        // 生成Token
        const token = btoa(username + ':' + Date.now());
        return new Response(JSON.stringify({ success: true, token: token, username: user.username }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: "账号或密码错误" }), { status: 401, headers: corsHeaders });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
  }

  // 获取用户信息（需要Token）
  if (path === '/api/user/info' && method === 'GET') {
    try {
      const token = request.headers.get('Authorization')?.split(' ')[1];
      if (!token) return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: corsHeaders });
      const username = atob(token).split(':')[0];
      const user = await env.DB.prepare("SELECT username, ip FROM users WHERE username = ?").bind(username).first();
      if (!user) return new Response(JSON.stringify({ error: "用户不存在" }), { status: 404, headers: corsHeaders });
      return new Response(JSON.stringify({ username: user.username, ip: user.ip }), { headers: corsHeaders });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
  }
}