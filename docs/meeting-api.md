# meeting-web 接口文档

> 依据前端代码（`src/api/client.ts`、`src/api/types.ts` 及全部调用处）梳理。
> 后端 `meeting-server` 源码不在本仓库，字段以实际发送/消费的请求为准。

## 通用约定

### 基础地址

- 本地开发：同源 `/app/api`，由 Vite 代理到 `http://127.0.0.1:8088`。
- 生产：`VITE_API_BASE`（例如 `https://43.143.218.217`）+ `/app/api`。
- 下文所有链接均为相对 `/app/api` 的路径。

### 认证

- 登录成功后前端将 token 存入 `sessionStorage`（key：`meetingAuthToken`）。
- 除 `/auth/*` 外，所有请求自动附带两个请求头：
  - `X-Auth-Token: <token>`
  - `Authorization: Bearer <token>`
- 视频流 / 下载地址不走 JSON 请求，由 `authStreamUrl`/`authDownloadUrl` 生成，token 以查询参数 `_authToken=<token>` 附加。

### 响应与错误

- JSON 响应直接返回业务数据体（无统一 `{code, data}` 包裹）。
- 无内容操作返回 `204 No Content`。
- 错误时返回非 2xx 状态码，错误体形如：

```json
{ "message": "错误信息", "error": "错误信息" }
```

- 前端遇到 `401`（且非 `/auth/*` 路径）会清除 token 并广播 `meeting-auth-expired` 事件。

---

## 一、认证接口

### 1. 登录

- 方法：`POST`
- 链接：`/auth/login`
- 入参（JSON Body）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

- 出参：

| 字段 | 类型 | 说明 |
|------|------|------|
| token | string | 后续请求使用的认证 token |

### 2. 当前用户信息

- 方法：`GET`
- 链接：`/auth/me`
- 入参：无
- 出参（`UserInfo`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户 ID |
| username | string | 用户名 |
| displayName | string | 显示名 |
| role | string | 角色 |
| admin | boolean | 是否管理员 |

### 3. 登出

- 方法：`POST`
- 链接：`/auth/logout`
- 入参：无
- 出参：无内容（204）

---

## 二、会议接口

### 4. 会议列表（含筛选）

- 方法：`GET`
- 链接：`/meetings`
- 入参（Query）：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| scope | string | 否 | 范围，默认 `mine` |
| startFrom | string | 是 | 开始日期，格式 `yyyy-MM-dd` |
| startTo | string | 是 | 结束日期，格式 `yyyy-MM-dd` |

- 出参（`Meeting[]`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 会议 ID |
| title | string | 会议标题 |
| roomName | string | 会议号（房间名） |
| hostUserName | string | 主持人用户名 |
| meetingType | string | 会议类型（如 `INSTANT`/`SCHEDULED`） |
| accessMode | string | 访问模式（`INVITE_ONLY`/`ALL_USERS`） |
| status | string | 原始状态码 |
| statusDisplay | string | 状态展示文案 |
| scheduledStartDisplay | string | 开始时间展示文案 |
| myRoleLabel | string | 我的角色文案 |
| host | boolean | 我是否为主持人 |
| canJoinNow | boolean | 当前是否可入会 |
| canEdit | boolean | 我是否有编辑权限 |
| description | string? | 会议说明 |
| scheduledStart | string? | 计划开始时间（ISO） |
| scheduledEnd | string? | 计划结束时间（ISO） |

### 5. 创建会议

- 方法：`POST`
- 链接：`/meetings`
- 入参（JSON Body）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 会议标题（≤128 字符） |
| meetingType | string | 是 | `INSTANT`（快速会议）或 `SCHEDULED`（预定会议） |
| accessMode | string | 是 | `INVITE_ONLY` 或 `ALL_USERS` |
| description | string | 否 | 会议说明（≤512 字符） |
| inviteeUserIds | string[] | 是 | 参会人用户 ID 列表（`INVITE_ONLY` 时生效，可传空数组） |
| scheduledStart | string | 否 | 计划开始时间（ISO 8601，仅预定会议） |
| scheduledEnd | string | 否 | 计划结束时间（ISO 8601，仅预定会议） |

- 出参：`Meeting`（同「会议列表」单条结构），创建成功后前端跳转详情页。

### 6. 会议详情

- 方法：`GET`
- 链接：`/meetings/:id/detail`
- 入参（Path）：`id`（会议 ID）
- 出参（`MeetingDetail`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| meeting | Meeting | 会议信息（同列表单条结构） |
| invitees | Invitee[] | 已邀请参会人 |
| inviteCandidates | UserSummary[] | 可添加的候选人 |
| canManage | boolean | 是否可管理参会人 |
| canEdit | boolean | 是否可编辑 |
| canDelete | boolean | 是否可删除 |
| joinLink | string | 入会链接 |

`Invitee`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 邀请记录 ID |
| userId | string | 用户 ID |
| userName | string | 用户名 |
| status | string | 参会状态 |
| lastRemindedDisplay | string? | 上次提醒时间展示文案 |

`UserSummary`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 用户 ID |
| username | string | 用户名 |
| displayName | string | 显示名 |
| role | string | 角色 |

### 7. 编辑会议

- 方法：`PUT`
- 链接：`/meetings/:id`
- 入参（Path）：`id`；Body（JSON）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 会议标题 |
| description | string/null | 是 | 会议说明，可为 null 清空 |
| accessMode | string | 是 | `INVITE_ONLY` 或 `ALL_USERS` |
| scheduledStart | string/null | 是 | 计划开始时间（ISO），可为 null |
| scheduledEnd | string/null | 是 | 计划结束时间（ISO），可为 null |

- 出参：无内容（204）

### 8. 删除会议

- 方法：`DELETE`
- 链接：`/meetings/:id`
- 入参（Path）：`id`
- 出参：无内容（204）

### 9. 按会议号加入

- 方法：`POST`
- 链接：`/meetings/join`
- 入参（JSON Body）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomName | string | 是 | 会议号（如 `room-xxxxxxxxxxxx`） |

- 出参：

| 字段 | 类型 | 说明 |
|------|------|------|
| redirect | string | 跳转路径（前端 `navigate` 使用） |
| message | string | 提示信息（可为空） |

### 10. 入会引导信息（Room Bootstrap）

- 方法：`GET`
- 链接：`/meetings/:id/room-bootstrap`
- 入参（Path）：`id`
- 出参（`MeetingRoomBootstrap`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| meetingId | string | 会议 ID |
| title | string | 会议标题 |
| roomName | string | Jitsi 房间名 |
| isHost | boolean | 当前用户是否主持人 |
| canEdit | boolean | 是否可编辑 |
| canDelete | boolean | 是否可删除 |
| jitsiDomain | string | Jitsi 域名 |
| recorderDomain | string | 录制端域名 |
| externalApiScriptUrl | string | Jitsi External API 脚本地址 |
| jitsiJwtEnabled | boolean | 是否启用 JWT 鉴权 |

### 11. Jitsi Token

- 方法：`GET`
- 链接：`/meetings/:id/jitsi-token`
- 入参（Path）：`id`
- 出参（`JitsiTokenResponse`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| enabled | boolean | 是否启用 JWT |
| jwt | string/null | Jitsi JWT（未启用时为 null） |
| roomName | string | 房间名 |
| domain | string | Jitsi 域名 |
| moderator | boolean | 是否为主持人 |

---

## 三、参会人接口

### 12. 添加参会人

- 方法：`POST`
- 链接：`/meetings/:id/invitees`
- 入参：Path `id`；Body（JSON）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 是 | 要添加的用户 ID |

- 出参：无内容（204）

### 13. 移除参会人

- 方法：`DELETE`
- 链接：`/meetings/:id/invitees/:userId`
- 入参（Path）：`id`（会议 ID）、`userId`（参会人用户 ID）
- 出参：无内容（204）

### 14. 提醒参会人

- 方法：`POST`
- 链接：`/meetings/:id/invitees/:userId/remind`
- 入参（Path）：`id`、`userId`
- 出参：无内容（204）

---

## 四、会议聊天接口

### 15. 消息列表

- 方法：`GET`
- 链接：`/meetings/:id/messages`
- 入参：Path `id`；Query：`limit`（数量，前端传 `100`，可选）
- 出参（`ChatMessage[]`）：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 消息 ID |
| userName | string | 发送者用户名 |
| content | string | 消息内容 |
| createdAt | string | 创建时间 |
| file | FileInfo? | 附件信息 |

`FileInfo`：

| 字段 | 类型 | 说明 |
|------|------|------|
| originalName | string | 原始文件名 |
| sizeBytes | number | 文件大小（字节） |
| downloadUrl | string | 下载地址（前端经 `authDownloadUrl` 附加 token 后使用） |

### 16. 发送消息（支持附件）

- 方法：`POST`
- 链接：`/meetings/:id/messages`
- 入参：Path `id`；Body 为 `multipart/form-data`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 否 | 文本内容（文本与附件至少一项） |
| file | file | 否 | 附件文件 |

- 出参：`ChatMessage`（新建的消息，结构同上）

---

## 五、录制回放接口

### 17. 我的录制列表

- 方法：`GET`
- 链接：`/recordings/mine`
- 入参：无
- 出参：

| 字段 | 类型 | 说明 |
|------|------|------|
| items | RecordingItem[] | 录制列表 |

`RecordingItem`：

| 字段 | 类型 | 说明 |
|------|------|------|
| recordingId | string | 录制 ID |
| title | string | 标题 |
| roomName | string | 房间名 |
| durationSec | number | 时长（秒） |
| playUrl | string | 播放地址 |

### 18. 录制流播放

- 方法：`GET`
- 链接：`/recordings/:recordingId/stream`（当 `playUrl` 缺失时的兜底地址）
- 入参：Path `recordingId`；视频流请求需带 `_authToken=<token>` 查询参数（由 `authDownloadUrl` 自动附加）
- 出参：视频流（非 JSON，直接作为 `<video src>`）

> 播放链接来源：优先使用 `RecordingItem.playUrl`，为空时回退到上述流地址。

---

## 六、用户 / 管理接口

### 19. 候选人列表（创建/编辑会议时可选参会人）

- 方法：`GET`
- 链接：`/users/candidates`
- 入参：无
- 出参：`UserSummary[]`（结构见「会议详情」中的 `UserSummary`）

### 20. 用户列表（管理员）

- 方法：`GET`
- 链接：`/admin/users`
- 入参：无
- 出参：`UserSummary[]`

### 21. 创建用户（管理员）

- 方法：`POST`
- 链接：`/admin/users`
- 入参（JSON Body）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| displayName | string | 是 | 显示名 |
| password | string | 是 | 密码 |

- 出参：无内容（204）

---

## 接口一览

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /auth/login | 登录 |
| GET | /auth/me | 当前用户信息 |
| POST | /auth/logout | 登出 |
| GET | /meetings | 会议列表（筛选） |
| POST | /meetings | 创建会议 |
| POST | /meetings/join | 按会议号加入 |
| GET | /meetings/:id/detail | 会议详情 |
| PUT | /meetings/:id | 编辑会议 |
| DELETE | /meetings/:id | 删除会议 |
| GET | /meetings/:id/room-bootstrap | 入会引导信息 |
| GET | /meetings/:id/jitsi-token | Jitsi Token |
| POST | /meetings/:id/invitees | 添加参会人 |
| DELETE | /meetings/:id/invitees/:userId | 移除参会人 |
| POST | /meetings/:id/invitees/:userId/remind | 提醒参会人 |
| GET | /meetings/:id/messages | 消息列表 |
| POST | /meetings/:id/messages | 发送消息（含附件） |
| GET | /recordings/mine | 我的录制列表 |
| GET | /recordings/:recordingId/stream | 录制流播放 |
| GET | /users/candidates | 候选人列表 |
| GET | /admin/users | 用户列表（管理员） |
| POST | /admin/users | 创建用户（管理员） |
