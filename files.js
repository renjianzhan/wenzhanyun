// files.js - 文件上传与列表管理
export async function handleFilesAPI(path, method, request, env) {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };

  // 获取文件列表
  if (path === '/api/files/list' && method === 'GET') {
    try {
      const token = request.headers.get('Authorization')?.split(' ')[1];
      if (!token) return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: corsHeaders });
      const username = atob(token).split(':')[0];

      const res = await fetch(`https://api.github.com/repos/renjianzhan/wenzhanyun/contents/users/${username}`, {
        headers: { 'Authorization': `token ${env.GH_TOKEN}` }
      });
      const files = await res.json();
      // 过滤掉 .gitkeep 文件，格式化返回数据
      const fileList = Array.isArray(files)
        ? files.filter(f => f.name !== '.gitkeep').map(f => ({
            name: f.name,
            type: f.name.split('.').pop(),
            size: (f.size / 1024).toFixed(2) + ' KB',
            url: f.html_url
          }))
        : [];
      return new Response(JSON.stringify({ files: fileList }), { headers: corsHeaders });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
  }

  // 上传文件
  if (path === '/api/files/upload' && method === 'POST') {
    try {
      const token = request.headers.get('Authorization')?.split(' ')[1];
      if (!token) return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: corsHeaders });
      const username = atob(token).split(':')[0];

      const { fileName, content } = await request.json();
      const gitReq = await fetch(`https://api.github.com/repos/renjianzhan/wenzhanyun/contents/users/${username}/${fileName}`, {
        method: "PUT",
        headers: { "Authorization": `token ${env.GH_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Upload ${fileName}`, content: content, branch: "main" })
      });
      if (!gitReq.ok) throw new Error("上传失败");
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
  }
}