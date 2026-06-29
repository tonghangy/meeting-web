# meeting-web

会议业务前端（React + Vite），与 `meeting-server` 方案 A 前后端分离部署。

**目录建议：** 与 Jitsi 仓库分开，例如 `D:\meeting-web`（后端仍在 `D:\jitsi\meeting-server`）。

访问路径与旧版一致：`/app/login`、`/app/rooms`、`/app/meeting/:id` 等。

## 本地开发

### 1. 启动后端（8088）

```powershell
cd d:\jitsi\meeting-server
mvn -DskipTests package
java -jar target\meeting-server-1.0.0-SNAPSHOT.jar
```

### 2. 启动前端（5173）

```powershell
cd d:\meeting-web
npm install
npm run dev
```

浏览器打开：**http://localhost:5173/app/login**

Vite 会把 `/app/api` 代理到 `http://localhost:8088`（见 `vite.config.ts`）。

## 生产构建（方案 A）

```powershell
cd d:\meeting-web
npm run build
```

产物在 `dist/`，部署到 Nginx 的 `/app/` 静态目录。

### Nginx 示例

```nginx
location /app/ {
    alias /var/www/meeting-web/dist/;
    try_files $uri $uri/ /app/index.html;
}

location /app/api/ {
    proxy_pass http://127.0.0.1:8088/app/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Jitsi 仍由根路径 `/` 提供，不变。

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `VITE_API_BASE` | API 前缀 | `/app/api` |

开发环境见 `.env.development`。

## 页面路由

| 路径 | 说明 |
|------|------|
| `/app/login` | 登录 |
| `/app/rooms` | 会议列表 |
| `/app/rooms/create` | 创建会议 |
| `/app/meeting/:id` | 入会（Jitsi + 会议交流） |
| `/app/meeting/:id/detail` | 会议详情 |
| `/app/meeting/:id/edit` | 编辑会议 |
| `/app/playback` | 回放 |
| `/app/admin/users` | 用户管理（管理员） |
