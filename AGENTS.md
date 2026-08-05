# AGENTS.md

## 适用范围

本文件适用于整个 `meeting-web` 仓库。若子目录中存在更具体的 `AGENTS.md`，则以离目标文件最近的规则为准。

## 项目概览

- 这是会议业务前端，技术栈为 React 18、TypeScript、Vite 和 React Router。
- 前端基础路径固定为 `/app/`，路由的 `basename` 为 `/app`。
- 开发环境通过 Vite 将 `/app/api` 代理到 `http://127.0.0.1:8088`。
- 本地前端使用 HTTPS，默认入口为 `https://127.0.0.1:5173/app/login`。
- 生产构建产物位于 `dist/`，部署服务器必须为 SPA 路由配置回退到 `/app/index.html`。

## 开发环境

此 Windows PC 的开发环境统一安装在 WSL2 中。所有 Node.js、包管理器、构建、测试、Git 辅助命令都应在 WSL2 内执行，不要使用 Windows 原生的 Node.js/npm 环境。

```bash
cd /mnt/d/work/meeting-web
```

从 PowerShell 发起命令时，也应显式进入 WSL2：

```powershell
wsl.exe bash -lc "cd /mnt/d/work/meeting-web && <command>"
```

注意：

- 不要混用 Windows 与 WSL2 生成的 `node_modules`。
- 不要手工编辑 `node_modules/`、`dist/` 或 `*.tsbuildinfo`。
- 仓库当前同时存在 `package-lock.json` 与 `pnpm-lock.yaml`。默认优先使用现有的 pnpm 环境；除非任务明确要求迁移包管理器，否则不要同时重写两个锁文件，也不要顺手删除其中任何一个。
- 安装或升级依赖前先说明必要性，并将锁文件变更限制在本次任务范围内。

## 常用命令

均在 WSL2 的仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm run dev
pnpm run build
pnpm run preview
```

- `pnpm run dev`：启动 `https://127.0.0.1:5173`。
- `pnpm run build`：执行 TypeScript 项目构建并生成 Vite 生产包，是当前最基本的提交前校验。
- 仓库目前没有独立的 `test` 或 `lint` 脚本。不要声称运行过不存在的检查；如新增测试或 lint 配置，应同时补充对应脚本和文档。
- 需要联调登录、会议或管理功能时，后端服务必须在 `127.0.0.1:8088` 可用。

## 目录与职责

- `src/pages/`：路由级页面。
- `src/components/`：可复用组件和页面布局组件。
- `src/context/`：认证、主题等跨页面状态。
- `src/api/client.ts`：统一请求、认证头、下载/流地址处理。
- `src/api/types.ts`：API 数据结构和共享类型。
- `src/lib/`：无 UI 的通用业务工具及 Jitsi 集成。
- `src/styles/app.css`：全局样式、设计令牌、主题和响应式规则。
- `src/App.tsx`：路由表和受保护路由结构。
- `vite.config.ts`：`/app/` 基础路径、HTTPS 开发服务器和 API 代理。
- `design.md`：现有设计系统、主题、断点和无障碍约束。

## 实现约定

### TypeScript 与 React

- 保持 TypeScript 严格模式通过；不要用 `any`、无意义的类型断言或关闭检查来掩盖问题。
- `noUnusedLocals` 和 `noUnusedParameters` 已启用，不保留未使用的导入、变量或参数。
- 使用函数组件与 Hooks，沿用当前的具名导出/默认导出风格，不为简单状态引入额外状态库。
- 页面只负责页面编排；可复用交互应提取到 `components/`，纯逻辑应提取到 `lib/`。
- 保持改动聚焦。不要在功能修复中顺带大规模重构、重排文件或格式化无关代码。

### API 与认证

- 所有普通 API 请求通过 `apiFetch` 发出，不在页面组件内重复实现认证头、错误解析或 API 基础地址。
- API 路径使用相对于 `VITE_API_BASE` 的路径，不硬编码后端主机、端口或生产域名。
- 后端返回结构应先在 `src/api/types.ts` 中建模，再用于页面和组件。
- 认证 token 存储在 `sessionStorage`，并由 API 客户端同时添加 `X-Auth-Token` 与 `Authorization`；修改认证流程时必须兼容现有后端约定。
- 视频流和下载地址使用 `authStreamUrl`/`authDownloadUrl`，不要自行拼接认证查询参数。
- 未得到后端支持前，不展示伪造的会议纪要、转录、附件、行动项或 AI 洞察。

### 路由

- `BrowserRouter` 已配置 `basename="/app"`，`App.tsx` 中的路由应继续写成 `/rooms`、`/meeting/:id` 等 basename 内路径。
- 新增受登录保护的页面时，将其放在 `ProtectedRoute` 下；需要全局导航的页面放在 `MainLayout` 下。
- 不要把 `/app` 在 Router 路径中重复拼接。
- 改动路由后至少验证直接访问、页面刷新和未知路径重定向。

### 样式与交互

- 优先复用 `src/styles/app.css` 中的颜色、间距、字号、圆角、阴影和动效令牌。
- 源 CSS 使用 `px`；PostCSS 会在构建时转换为 `rem`。不要用脚本动态修改根字号。
- 响应式断点保持为 `design.md` 约定的 px 范围，避免页面横向溢出。
- 修改主题时同时检查 `reference-inspired`、`professional-light` 和 `focus-dark`。
- 保持键盘可操作、清晰的 `:focus-visible`、可读的状态文字和至少 44px 的主要触控区域。
- 图标按钮必须有可访问名称；状态不能只靠颜色表达。
- 不改变现有业务行为的视觉任务，应优先保留路由、接口参数、权限和会议操作逻辑。

## 工作流程

1. 修改前先查看 `git status`，确认并保留用户已有的未提交改动。
2. 阅读目标页面及其相关组件、类型、API 和样式，不根据文件名猜测行为。
3. 只修改完成任务所需的文件；不要覆盖、回退或暂存无关变更。
4. 完成后在 WSL2 中运行 `pnpm run build`。
5. 涉及 UI 或路由时，在可行情况下启动开发服务器并检查相关页面；需要真实数据的流程应明确后端依赖。
6. 最终说明改动内容、实际执行的校验，以及仍未验证的风险或依赖。

## 完成标准

- 请求的行为已实现，且没有用占位数据冒充真实后端功能。
- TypeScript 和生产构建通过。
- 相关路由、认证、API 错误态、加载态和空态得到合理处理。
- 桌面、MatePad 和手机布局没有明显回归。
- 未修改或删除用户的无关工作区变更。
