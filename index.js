// index.js - 主路由与权限拦截
import { handleUserAPI } from './user.js';
import { handleFilesAPI } from './files.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
    if (method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 1. 首页重定向
    if (path === '/' || path === '/index.html') {
      return Response.redirect(new URL('/index.html', request.url), 302);
    }

    // 2. 用户相关接口 (/api/user/*)
    if (path.startsWith('/api/user/')) {
      return handleUserAPI(path, method, request, env);
    }

    // 3. 文件相关接口 (/api/files/*)
    if (path.startsWith('/api/files/')) {
      return handleFilesAPI(path, method, request, env);
    }

    // 4. 拦截所有未匹配的后台页面（没登录就不让看）
    if (path === '/dashboard.html' || path === '/upload.html') {
      const token = request.headers.get('Authorization')?.split(' ')[1];
      if (!token) {
        return Response.redirect(new URL('/login.html', request.url), 302);
      }
    }

    return new Response("404 Not Found", { status: 404, headers: corsHeaders });
  }
};