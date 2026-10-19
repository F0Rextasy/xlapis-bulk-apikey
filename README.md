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

**Bulk-create Xlapis accounts with auto-generated API keys — OpenAI-compatible inference + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-16-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

Xlapis is a New-API panel whose door is a **"nofield" one**: `POST /api/user/register` takes a username and a password and **no mailbox at all** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). The catch is on the other side of the door — the `default` group has **no channel** for the cheap models, so a token created there answers `503 No available channel for model … under group default`. This tool therefore **binds the token to the model's own group** (`enable_groups[0]` from `/api/pricing`) and walks the cheapest priced models until the chat answers 200. The unit that scales is *one account per key*: 63 keys on the operator's fleet (60 from the mint rail, 3 minted by the shipped CLI while it was verified), every one proven by a live chat call.

## 🎁 Free tier — how much you get

**No mailbox, no captcha** — the account is the free thing, and the token is created with `unlimited_quota: true`.

| What | Value |
| --- | --- |
| Card required | **No** |
| Captcha / Turnstile | **none** (`turnstile_check: false`) |
| Mailbox | **not used** — the register call sends `{username, password}` only |
| Sign-up credit | measured **500** account quota on 3 CLI-minted accounts (≈ $0.001 — the gate runs on `unlimited_quota`, not on credit) |
| Channel gate | the model must be asked in a group that serves it; `default` answers `503` |
| The unit that scales | **one account = one key** → `--count N` is "N accounts" |

> 💡 The free tier is set by Xlapis and can change. Check the live numbers at [xlapis.com](https://xlapis.com) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 16 of them

The panel prices **18 ids**, of which **16 are chat-capable and carry an enabled group** (two `seedance-*` video ids in group `视频模型` are skipped — a name-only filter walks them first and wastes the account). Only ids that answered a live **200** with a real key are listed:

| Model ID | ✓ | Group | Notes |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | the cheapest chat id — the gate stops here on every account |

Ids the panel offers with an enabled group (kept for the gate's fallback order, not gated here): `grok-4.5`, `grok-4.6` (group `grok-缓存分组`), `gpt-5.6-luna` (group `GPT-plus-速刷-稳定版`). The `default` group serves none of them.

## 🧪 How to use the API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Quick start

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

`keys.txt` is written **only** after a live chat completion proves the key.

| Mode | What it does |
| --- | --- |
| `run` (default) | mint accounts until `--count`, gate every key with a live chat |
| `--verify-only` | re-sweep `keys.txt`, moving anything that fails to `keys-ungated.txt` |
| `--screen` | test your proxy list against the panel → `proxies.live.txt` |
| `--probe` | environment check: panel flags, pricing, gate order, exits |
| `--collect` | rebuild `keys.txt` from `accounts.json` (every `chat_status: 200` row) |

### 🖱️ The launcher

The launcher asks for the proxy list, count and model, remembers them in `launcher.config.json`, and runs the CLI with the right flags.

## ✅ Verified working — every key is tested

| Check | Result |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 priced ids, **16 chat-capable with an enabled group**; cheapest chat id is `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — no mailbox, no captcha (503 is retried twice, then the call is retried with an e-mail field) |
| `POST /api/user/login` | **200** — `access_token` (cookie + `New-Api-User` fallback for older forks) |
| `GET /api/user/self` | **200** — quota 500 on a fresh account |
| `POST /api/token/` → `POST /api/token/<id>/key` | token created **inside the model's group**, plaintext key revealed |
| `POST /v1/chat/completions` — run for **every** key before it is written | **200** with real content (`choices`, no `error`) |
| a key that fails its chat check | never written to `keys.txt` |

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| signup | `POST /api/user/register {username,password}` | no e-mail field; a 5xx is retried after 2.5 s, then the call is retried with an address |
| login | `POST /api/user/login {username,password}` | `access_token`, plus the session cookie for forks that only return a cookie |
| account | `GET /api/user/self` | id + quota |
| pricing | `GET /api/pricing` | cheapest chat model and its `enable_groups[0]` — the group the token must live in |
| key | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; the group is what makes it answer |
| check | `POST /v1/chat/completions` | live 200 required before `keys.txt`; a 429 is a pace signal (wait 2.5 s, retry the same model) |

## ⚙️ CLI options

```bash
node src/cli.js [mode] [flags]
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count N` | 10 | accounts (= keys) to mint |
| `--conc N` | 2 | accounts in flight (max 16) — one exit is pinned per worker |
| `--host <name>` | `xlapis.com` | panel host (the same rail runs on mirrors of this panel) |
| `--model <id>` | cheapest priced | pin the gate to one model id |
| `--group <name>` | the model's group | pin the token group |
| `--pool <file>` | `proxies.txt` | proxy list (`XLAPIS_PROXIES` env works too) |
| `--gap MS` | 800 | pause between models inside one account |
| `--tries N` | 2 | exits tried per account |

A screened list may carry a trailing note (`http://host:port 1.2.3.4`) — the loader keeps the first column.

## 🛰️ Behind a proxy

Every request leaves through an exit from your pool — the tool never dials the panel directly, and **one account lives on one exit** for its whole life (the panel binds the session to the IP). Measured on the operator's fleet: 18 of 23 exits could reach the panel, and 3 accounts at conc 2 produced **3/3 live keys in 72 s** (≈20 s/key).

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | chat-200 keys, one per line — git-ignored |
| `keys-ungated.txt` | keys that failed the last `--verify-only` sweep — retry later |
| `accounts.json` | username / quota / group / model / chat status per account — git-ignored |
| `proxies.txt` | your exit list — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router. One command turns `keys.txt` into a provider-node with working combos:

```bash
node src/connect-9router.js
```

Defaults: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 What the provider gives | one account per key — mailbox-free sign-up, group-bound token, every key chat-verified |
| 🔑 What one key gets you | one API key scoped to its own account: the 16 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Your data | only xlapis.com and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

If the panel changes its door, its group list or its channel map, the tool stops at that step and says so (`--probe` shows what it sees). **[Open an issue](../../issues)** with the command you ran and the exact output; PRs are welcome.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>
