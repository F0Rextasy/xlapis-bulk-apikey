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

**自動生成された API キーで Xlapis アカウントを一括作成 — OpenAI 互換の推論 + 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-16-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 イシュー](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

Xlapis は New-API パネルであり、その入口は **「nofield」なもの** です。`POST /api/user/register` はユーザー名とパスワードを受け取り、**メールボックスは一切不要** です（`GET /api/status` → `email_verification: false`、`turnstile_check: false`）。落とし穴は入口の反対側にあります — `default` グループには安価なモデル用の **チャネルが存在しない** ため、そこで作成されたトークンは `503 No available channel for model … under group default` を返します。したがってこのツールは **トークンをモデル自身のグループに紐付け**（`/api/pricing` の `enable_groups[0]`）、チャットが 200 を返すまで最も安価なモデルを順に試します。スケールする単位は *1 アカウントにつき 1 キー* です。運用者のフリート上のキー（ミントレールから 60、検証中に同梱 CLI がミントした 3）は、すべてライブチャット呼び出しで証明されています。

## 🎁 無料枠 — どれだけ得られるか

**メールボックス不要、キャプチャ不要** — アカウント自体が無料のものであり、トークンは `unlimited_quota: true` で作成されます。

| 項目 | 値 |
| --- | --- |
| カード登録 | **不要** |
| キャプチャ / Turnstile | **なし**（`turnstile_check: false`） |
| メールボックス | **未使用** — 登録呼び出しは `{username, password}` のみを送信 |
| 登録クレジット | CLI でミントした 3 アカウントで **500** のアカウントクォータを計測（約 $0.001 — ゲートはクレジットではなく `unlimited_quota` で動作） |
| チャネルゲート | モデルはそれを提供するグループで要求する必要がある。`default` は `503` を返す |
| スケールする単位 | **1 アカウント = 1 キー** → `--count N` は「N アカウント」 |

> 💡 無料枠は Xlapis が設定するものであり、変更される可能性があります。最新の数値は [xlapis.com](https://xlapis.com) で確認してください — そしてツール自身のゲートに判断を委ねてください:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 16 種

パネルは **18 個の id** に価格を設定しており、そのうち **16 個がチャット対応で有効なグループを持つ**（グループ `视频模型` の 2 つの `seedance-*` 動画 id はスキップされます — 名前だけのフィルタではこれらを最初に試してしまいアカウントを無駄にします）。実際のキーでライブ **200** を返した id のみを掲載しています:

| モデル ID | ✓ | グループ | 備考 |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | 最も安価なチャット id — ゲートはすべてのアカウントでここで停止 |

パネルが有効なグループとともに提供する id — 1 つずつ固定して検証（各キー、--verify-only --model id）— そしてそれ自体ではどれも応答しませんでした: すべてのキーは deepseek-v4.1-flash にフォールバックしました。これらはゲートのフォールバック順序に残り、検証済みテーブルには含まれません。`default` グループはこれらのいずれも提供しません。

## 🧪 API の使い方

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 クイックスタート

```bash

# clone or fork this repository, then:
cd xlapis-bulk-apikey

# 1) optional: your proxy list, one per line (http://… or socks5://…)
printf 'http://127.0.0.1:8080\n' > proxies.txt
#    (skip this — without a pool the tool connects directly)

# 2) go
node src/launcher.js              # interactive
# or directly:
node src/cli.js --count 50 --conc 2
```

`keys.txt` は、ライブチャット補完がキーを証明した **後にのみ** 書き込まれます。

| モード | 動作 |
| --- | --- |
| `run`（デフォルト） | `--count` までアカウントをミントし、すべてのキーをライブチャットでゲート |
| `--verify-only` | `keys.txt` を再スイープし、失敗したものを `keys-ungated.txt` に移動 |
| `--screen` | プロキシリスト（または直接ルート）をパネルに対してテスト → `proxies.live.txt` |
| `--probe` | 環境チェック: パネルフラグ、価格、ゲート順序、終了 |
| `--collect` | `accounts.json` から `keys.txt` を再構築（すべての `chat_status: 200` 行） |

### 🖱️ ランチャー

ランチャーはプロキシリスト、カウント、モデルを尋ね、それらを `launcher.config.json` に記憶し、適切なフラグで CLI を実行します。

## ✅ 検証済みで動作 — すべてのキーがテスト済み

| チェック | 結果 |
| --- | --- |
| `GET /api/status` | **200** — `XL API`、`password_register_enabled: true`、`email_verification: false`、`turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 個の価格設定済み id、**16 個がチャット対応で有効なグループを持つ**。最も安価なチャット id は `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — メールボックス不要、キャプチャ不要（503 は 2 回再試行され、その後メールフィールド付きで呼び出しが再試行される） |
| `POST /api/user/login` | **200** — `access_token`（古いフォーク用に cookie + `New-Api-User` フォールバック） |
| `GET /api/user/self` | **200** — 新規アカウントでクォータ 500 |
| `POST /api/token/` → `POST /api/token/<id>/key` | トークンは **モデルのグループ内で** 作成され、平文キーが公開される |
| `POST /v1/chat/completions` — 書き込まれる前に **すべての** キーに対して実行 | 実際のコンテンツで **200**（`choices`、`error` なし） |
| チャットチェックに失敗したキー | `keys.txt` に書き込まれることはない |

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブ `chat-200` を通過しています
> （死んだキーは決して出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います: エントリは
> **モデルが `chat-200` を返し、ツールを呼び出せる場合にのみ** 追加されます — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダは追加されずに除外されます。検証ステップはいつでも再実行できます。
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| 登録 | `POST /api/user/register {username,password}` | メールフィールドなし。5xx は 2.5 秒後に再試行され、その後アドレス付きで呼び出しが再試行される |
| ログイン | `POST /api/user/login {username,password}` | `access_token`、加えて cookie のみを返すフォーク用のセッション cookie |
| アカウント | `GET /api/user/self` | id + クォータ |
| 価格 | `GET /api/pricing` | 最も安価なチャットモデルとその `enable_groups[0]` — トークンが存在すべきグループ |
| キー | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`。グループが応答を可能にする |
| チェック | `POST /v1/chat/completions` | `keys.txt` の前にライブ 200 が必要。429 はペース信号（2.5 秒待機し、同じモデルを再試行） |

## ⚙️ CLI オプション

```bash
node src/cli.js [mode] [flags]
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count N` | 10 | ミントするアカウント（= キー）数 |
| `--conc N` | 2 | 同時実行中のアカウント数（最大 16）— ワーカーごとに 1 つの出口が固定される |
| `--host <name>` | `xlapis.com` | パネルホスト（同じレールはこのパネルのミラーでも動作） |
| `--model <id>` | 最も安価な価格設定済み | ゲートを 1 つのモデル id に固定 |
| `--group <name>` | モデルのグループ | トークングループを固定 |
| `--pool <file>` | `proxies.txt` | プロキシリスト（`XLAPIS_PROXIES` 環境変数も可） |
| `--gap MS` | 800 | 1 アカウント内のモデル間のポーズ |
| `--tries N` | 2 | アカウントごとに試行する出口数 |

スクリーニング済みリストには末尾に注記が付く場合があります（`http://host:port 1.2.3.4`）— ローダーは最初の列を保持します。

## 🛰️ プロキシの背後で

**オプション — 大規模運用では推奨（IP ごとの制限、BAN）。** ツールはプロキシなしでも動作します。

- **プールあり:** `--pool <file>` を渡す（または `XLAPIS_PROXIES` を設定する）と、すべてのリクエストがそのリストの出口を経由します — **1 つのアカウントはそのライフサイクル全体を通じて 1 つの出口上に存在し**（パネルはセッションを IP に紐付ける）、死んだ回線はその試行を失敗させ、ツールは次のものに移ります。
- **プールなし:** CLI は `running WITHOUT a proxy (direct)` と表示し、直接接続します。登録、キーミント、チャットゲートについて何も変わりません — 変わるのはパケットが出ていく場所だけです。
- どちらのモードでも `--screen` を実行してください: 実際の実行前に、持っている出口（または直接ルート）をパネルに対してテストします。

運用者のフリートでの計測: 23 の出口のうち 18 がパネルに到達でき、conc 2 で 3 アカウントが **72 秒で検証済みの動作キーを生成** しました（≈20 秒/キー）。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | chat-200 キー、1 行に 1 つ — git 無視 |
| `keys-ungated.txt` | 最後の `--verify-only` スイープに失敗したキー — 後で再試行 |
| `accounts.json` | アカウントごとのユーザー名 / クォータ / グループ / モデル / チャットステータス — git 無視 |
| `proxies.txt` | 出口リスト — git 無視 |

## 🔌 9Router に接続

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を動作するコンボを持つプロバイダノードに変換します:

```bash
node src/connect-9router.js
```

デフォルト: `--base http://localhost:20128`、`--password 123456`、`--name "Xlapis"`、`--prefix xlapis`、`--base-url https://xlapis.com/v1`。

## 🔌 OmniRoute に接続

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです。1 つのコマンドで `keys.txt` を動作するコンボを持つプロバイダノードに変換します:

```bash
node src/connect-omniroute.js
```

デフォルト: `--base http://localhost:20128`、`--password 123456`、`--name "Xlapis"`、`--prefix xlapis`、`--base-url https://xlapis.com/v1`。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダ | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 プロバイダが提供するもの | 1 キーにつき 1 アカウント — メールボックス不要の登録、グループに紐付いたトークン、すべてのキーがチャット検証済み |
| 🔑 1 つのキーで得られるもの | 自身のアカウントにスコープされた 1 つの API キー: 以下のエンドポイント上の 16 のモデル id を、プランの制限で利用可能。クォータは **アカウント** に存在し、まさにそれがこのツールが 1 キーにつき 1 アカウントを作成する理由です |
| 🌐 API 形式 | OpenAI 互換: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 あなたのデータ | 接触するのは xlapis.com と設定した受信トレイバックエンドのみ。キーはあなたのマシン上に留まります |

## 🐞 イシュー

パネルがその入口、グループリスト、またはチャネルマップを変更した場合、ツールはそのステップで停止し、その旨を報告します（`--probe` はそれが見ているものを表示します）。実行したコマンドと正確な出力を添えて **[イシューを開いてください](../../issues)**。PR も歓迎します。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>