export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ msg: '账号密码不能为空！' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const token = '这里替换成你的GitHub Token'; // ⚠️ 填入你的 Token
    const repo = 'renjianzhan/wenzhanyun';
    
    // 1. 读取现有的 users.json
    const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/users.json`, {
      headers: { 'Authorization': `token ${token}` }
    });
    const fileData = await fileRes.json();
    const users = JSON.parse(atob(fileData.content));

    // 2. 检查用户是否已存在
    if (users.some(u => u.username === username)) {
      return new Response(JSON.stringify({ msg: '用户名已存在！' }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. 把新用户加进去，并更新 users.json
    users.push({ username, password, ip: context.request.headers.get('CF-Connecting-IP') || 'unknown' });
    const newContent = btoa(JSON.stringify(users));
    
    await fetch(`https://api.github.com/repos/${repo}/contents/users.json`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Register user: ${username}`, content: newContent, sha: fileData.sha, branch: 'main' })
    });

    // 4. 自动在 GitHub 创建用户文件夹
    await fetch(`https://api.github.com/repos/${repo}/contents/users/${username}/.gitkeep`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Init folder for ${username}`, content: '', branch: 'main' })
    });

    return new Response(JSON.stringify({ msg: `注册成功！已为你分配 100MB 空间` }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ msg: '注册报错: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}