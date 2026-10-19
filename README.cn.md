<div align="center">

```
██╗  ██╗██╗      █████╗ ██████╗ ██╗███████╗
╚██╗██╔╝██║     ██╔══██╗██╔══██╗██║██╔════╝
 ╚███╔╝ ██║     ███████║██████╔╝██║███████╗
 ██╔██╗ ██║     ██╔══██║██╔═══╝ ██║╚════██║
██╔╝ ██╗███████╗██║  ██║██║     ██║███████║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
```

# xlapis-bulk-apikey

**批量创建 Xlapis 账户并自动生成 API 密钥 — 兼容 OpenAI 的推理 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-16-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>


---

## ✨ 为什么会有这个工具

Xlapis 是一个 New-API 面板，它的入口是一扇**“无字段”之门**：`POST /api/user/register` 只接收用户名和密码，**完全不需要邮箱**（`GET /api/status` → `email_verification: false`，`turnstile_check: false`）。问题出在门的另一侧——`default` 分组**没有**廉价模型的渠道，因此在那里创建的令牌会返回 `503 No available channel for model … under group default`。所以本工具会**把令牌绑定到模型自身所属的分组**（来自 `/api/pricing` 的 `enable_groups[0]`），并依次尝试价格最低的模型，直到聊天接口返回 200。可扩展的单位是*每个密钥一个账户*：运营者的集群上有 63 个密钥（60 个来自批量铸造通道，3 个由随附的 CLI 在验证期间铸造），每一个都通过一次实时聊天调用得到证实。

## 🎁 免费额度 — 你能获得多少

**无需邮箱，无需验证码**——账户本身是免费的，令牌以 `unlimited_quota: true` 创建。

| 项目 | 值 |
| --- | --- |
| 需要银行卡 | **否** |
| 验证码 / Turnstile | **无**（`turnstile_check: false`） |
| 邮箱 | **不使用**——注册调用只发送 `{username, password}` |
| 注册赠送额度 | 在 3 个 CLI 铸造的账户上测得 **500** 账户配额（约 $0.001——门槛取决于 `unlimited_quota`，而非额度） |
| 渠道门槛 | 必须在提供该模型的分组中请求该模型；`default` 返回 `503` |
| 可扩展的单位 | **一个账户 = 一个密钥** → `--count N` 即“N 个账户” |

> 💡 免费额度由 Xlapis 设定，可能会变化。请在 [xlapis.com](https://xlapis.com) 查看实时数据——并让工具自身的门槛来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 — 全部 16 个

面板为 **18 个 id** 定价，其中 **16 个支持聊天并带有已启用的分组**（分组 `视频模型` 中的两个 `seedance-*` 视频 id 被跳过——仅按名称过滤会先遍历它们并浪费账户）。仅列出使用真实密钥通过实时 **200** 验证的 id：

| 模型 ID | ✓ | 分组 | 备注 |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | 最便宜的聊天 id——每个账户的门槛都在此停止 |

面板提供的带有已启用分组的 id（保留用于门槛的回退顺序，此处未设门槛）：`grok-4.5`、`grok-4.6`（分组 `grok-缓存分组`）、`gpt-5.6-luna`（分组 `GPT-plus-速刷-稳定版`）。`default` 分组不提供其中任何一个。

## 🧪 如何使用 API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 快速开始

```bash
# clone or fork this repository, then:
cd xlapis-bulk-apikey

# 1) your proxy list, one per line (http://… or socks5://…)
printf 'http://127.0.0.1:8080\n' > proxies.txt

# 2) go
node src/launcher.js              # interactive
# or directly:
node src/cli.js --count 50 --conc 2
```

`keys.txt` **只有**在一次实时聊天补全证明该密钥有效后才会写入。

| 模式 | 作用 |
| --- | --- |
| `run`（默认） | 铸造账户直到达到 `--count`，用实时聊天验证每个密钥 |
| `--verify-only` | 重新扫描 `keys.txt`，将任何失败的密钥移入 `keys-ungated.txt` |
| `--screen` | 用你的代理列表测试面板 → `proxies.live.txt` |
| `--probe` | 环境检查：面板标志、定价、门槛顺序、出口 |
| `--collect` | 从 `accounts.json` 重建 `keys.txt`（每个 `chat_status: 200` 的行） |

### 🖱️ 启动器

启动器会询问代理列表、数量和模型，将它们记入 `launcher.config.json`，并使用正确的标志运行 CLI。

## ✅ 已验证可用 — 每个密钥都经过测试

| 检查 | 结果 |
| --- | --- |
| `GET /api/status` | **200** — `XL API`，`password_register_enabled: true`，`email_verification: false`，`turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 个定价 id，**16 个支持聊天并带有已启用分组**；最便宜的聊天 id 是 `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — 无邮箱，无验证码（503 会重试两次，然后使用邮箱字段重试该调用） |
| `POST /api/user/login` | **200** — `access_token`（cookie + 针对旧分支的 `New-Api-User` 回退） |
| `GET /api/user/self` | **200** — 新账户配额为 500 |
| `POST /api/token/` → `POST /api/token/<id>/key` | 令牌创建于**模型所属分组内**，明文密钥被揭示 |
| `POST /v1/chat/completions` — 在写入**每个**密钥前运行 | **200** 并返回真实内容（`choices`，无 `error`） |
| 未通过聊天检查的密钥 | 绝不写入 `keys.txt` |

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 注册 | `POST /api/user/register {username,password}` | 无邮箱字段；5xx 会在 2.5 秒后重试，然后使用地址重试该调用 |
| 登录 | `POST /api/user/login {username,password}` | `access_token`，以及针对仅返回 cookie 的分支的会话 cookie |
| 账户 | `GET /api/user/self` | id + 配额 |
| 定价 | `GET /api/pricing` | 最便宜的聊天模型及其 `enable_groups[0]`——令牌必须所在的分组 |
| 密钥 | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`；分组才是让它能应答的关键 |
| 检查 | `POST /v1/chat/completions` | 写入 `keys.txt` 前必须实时返回 200；429 是节奏信号（等待 2.5 秒，重试同一模型） |

## ⚙️ CLI 选项

```bash
node src/cli.js [mode] [flags]
```

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | 10 | 要铸造的账户数（= 密钥数） |
| `--conc N` | 2 | 并发处理的账户数（最大 16）——每个工作线程固定一个出口 |
| `--host <name>` | `xlapis.com` | 面板主机（同一通道也运行在此面板的镜像上） |
| `--model <id>` | 最便宜的定价模型 | 将门槛固定到一个模型 id |
| `--group <name>` | 模型的分组 | 固定令牌分组 |
| `--pool <file>` | `proxies.txt` | 代理列表（`XLAPIS_PROXIES` 环境变量也可用） |
| `--gap MS` | 800 | 一个账户内模型之间的暂停 |
| `--tries N` | 2 | 每个账户尝试的出口数 |

筛选后的列表可能带有尾注（`http://host:port 1.2.3.4`）——加载器只保留第一列。

## 🛰️ 在代理之后

每个请求都通过你池中的一个出口发出——工具从不直接连接面板，并且**一个账户在其整个生命周期内都位于一个出口上**（面板将会话绑定到 IP）。在运营者的集群上测得：23 个出口中有 18 个能到达面板，并发为 2 的 3 个账户在 72 秒内产生了 **3/3 个可用密钥**（约 20 秒/密钥）。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 聊天返回 200 的密钥，每行一个——已被 git 忽略 |
| `keys-ungated.txt` | 上次 `--verify-only` 扫描中失败的密钥——稍后重试 |
| `accounts.json` | 每个账户的用户名 / 配额 / 分组 / 模型 / 聊天状态——已被 git 忽略 |
| `proxies.txt` | 你的出口列表——已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器。一条命令即可将 `keys.txt` 转换为带有可用组合的提供商节点：

```bash
node src/connect-9router.js
```

默认值：`--base http://localhost:20128`，`--password 123456`，`--name "Xlapis"`，`--prefix xlapis`，`--base-url https://xlapis.com/v1`。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供商 | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 提供商提供什么 | 每个密钥一个账户——免邮箱注册、绑定分组的令牌、每个密钥都经过聊天验证 |
| 🔑 一个密钥能给你什么 | 一个限定于其自身账户的 API 密钥：下方端点上的 16 个模型 id，受你的套餐限制。配额存在于**账户**上，这正是本工具为每个密钥创建一个账户的原因 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://xlapis.com/v1/chat/completions` |
| 🔒 你的数据 | 仅联系 xlapis.com 和你配置的收件箱后端；密钥保留在你的机器上 |

## 🐞 问题反馈

如果面板更改了它的入口、分组列表或渠道映射，工具会在该步骤停止并说明原因（`--probe` 会显示它所看到的内容）。请**[提交 issue](../../issues)**，附上你运行的命令和确切的输出；欢迎 PR。

## 📄 许可证

MIT © 2026 — 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>