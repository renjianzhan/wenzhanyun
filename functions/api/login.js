export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ msg: '请输入账号和密码！' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const token = '这里替换成你的GitHub Token'; // ⚠️ 填入你的 Token
    const repo = 'renjianzhan/wenzhanyun';

    // 1. 读取 users.json
    const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/users.json`, {
      headers: { 'Authorization': `token ${token}` }
    });
    const fileData = await fileRes.json();
    const users = JSON.parse(atob(fileData.content));

    // 2. 查找用户并验证密码
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      // 登录成功，返回用户信息和 Token
      return new Response(JSON.stringify({ 
        msg: `登录成功！欢迎回来 ${username}`, 
        username: username, 
        token: token 
      }), { headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ msg: '账号或密码错误！' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (e) {
    return new Response(JSON.stringify({ msg: '登录报错: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
        }
