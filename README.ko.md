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

**자동 생성된 API 키로 Xlapis 계정을 대량 생성 — OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-16-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 이 도구가 존재하는 이유

Xlapis는 문이 **"nofield"** 방식인 New-API 패널입니다. `POST /api/user/register`는 사용자 이름과 비밀번호를 받고 **메일함은 전혀 필요로 하지 않습니다** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). 함정은 문 반대편에 있습니다. `default` 그룹에는 저렴한 모델을 위한 **채널이 없어서**, 거기서 생성된 토큰은 `503 No available channel for model … under group default`라고 응답합니다. 따라서 이 도구는 **토큰을 모델 자체의 그룹**(`/api/pricing`의 `enable_groups[0]`)에 바인딩하고, 채팅이 200을 응답할 때까지 가장 저렴한 가격의 모델들을 순회합니다. 확장되는 단위는 *키당 하나의 계정*입니다. 운영자의 플릿에 있는 키(민트 레일에서 60개, 검증 중에 함께 제공된 CLI로 민트된 3개)는 모두 실제 채팅 호출로 입증되었습니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

**메일함도, 캡차도 없음** — 계정 자체가 무료이며, 토큰은 `unlimited_quota: true`로 생성됩니다.

| 항목 | 값 |
| --- | --- |
| 카드 필요 | **아니오** |
| 캡차 / Turnstile | **없음** (`turnstile_check: false`) |
| 메일함 | **사용되지 않음** — register 호출은 `{username, password}`만 전송 |
| 가입 크레딧 | CLI로 민트된 3개 계정에서 계정 쿼터 **500** 측정 (≈ $0.001 — 게이트는 크레딧이 아니라 `unlimited_quota`로 작동) |
| 채널 게이트 | 모델은 그것을 서비스하는 그룹에서 요청되어야 함; `default`는 `503` 응답 |
| 확장되는 단위 | **하나의 계정 = 하나의 키** → `--count N`은 "N개의 계정" |

> 💡 무료 티어는 Xlapis가 설정하며 변경될 수 있습니다. 실시간 수치는 [xlapis.com](https://xlapis.com)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하도록 두세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 키가 실제 채팅 호출로 재검증됨
```

## 🤖 모델 — 16개 전부

패널은 **18개의 id**에 가격을 매기며, 그중 **16개가 채팅 가능하고 활성화된 그룹을 가집니다** (그룹 `视频模型`의 두 `seedance-*` 비디오 id는 건너뜁니다 — 이름만 필터링하면 이들을 먼저 순회하며 계정을 낭비합니다). 실제 키로 라이브 **200**을 응답한 id만 나열합니다:

| 모델 ID | ✓ | 그룹 | 비고 |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | 가장 저렴한 채팅 id — 게이트가 모든 계정에서 여기서 멈춤 |

패널이 활성화된 그룹과 함께 제공하는 id들 - 하나씩 고정(각 키, --verify-only --model id) - 그리고 그중 어느 것도 자체적으로 응답하지 않았습니다: 모든 키가 deepseek-v4.1-flash로 폴백되었습니다. 이들은 게이트 폴백 순서에 남고 검증된 표에서는 제외됩니다. `default` 그룹은 이들 중 어느 것도 서비스하지 않습니다.

## 🧪 API 사용 방법

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 빠른 시작

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

`keys.txt`는 실제 채팅 완성이 키를 입증한 **후에만** 작성됩니다.

| 모드 | 하는 일 |
| --- | --- |
| `run` (기본) | `--count`까지 계정을 민트하고, 모든 키를 실제 채팅으로 게이트 |
| `--verify-only` | `keys.txt`를 재검사하여 실패한 항목을 `keys-ungated.txt`로 이동 |
| `--screen` | 프록시 목록(또는 직접 경로)을 패널에 대해 테스트 → `proxies.live.txt` |
| `--probe` | 환경 점검: 패널 플래그, 가격, 게이트 순서, 종료 |
| `--collect` | `accounts.json`에서 `keys.txt` 재구성 (모든 `chat_status: 200` 행) |

### 🖱️ 런처

런처는 프록시 목록, 개수, 모델을 묻고 이를 `launcher.config.json`에 기억한 뒤 올바른 플래그로 CLI를 실행합니다.

## ✅ 검증됨 — 모든 키가 테스트됨

| 점검 | 결과 |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18개의 가격 책정된 id, **16개가 활성화된 그룹과 함께 채팅 가능**; 가장 저렴한 채팅 id는 `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — 메일함 없음, 캡차 없음 (503은 두 번 재시도 후, 이메일 필드와 함께 호출 재시도) |
| `POST /api/user/login` | **200** — `access_token` (쿠키 + 구형 포크를 위한 `New-Api-User` 폴백) |
| `GET /api/user/self` | **200** — 새 계정에서 쿼터 500 |
| `POST /api/token/` → `POST /api/token/<id>/key` | **모델의 그룹 내부에** 토큰 생성, 평문 키 노출 |
| `POST /v1/chat/completions` — 작성되기 전 **모든** 키에 대해 실행 | 실제 콘텐츠와 함께 **200** (`choices`, `error` 없음) |
| 채팅 점검에 실패한 키 | `keys.txt`에 절대 작성되지 않음 |

> **품질 게이트.** 여기의 모든 키는 `keys.txt`에 작성되기 전에 라이브 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 조합도 모델 수준에서 동일한 규칙을 따릅니다: 항목은
> **모델이 `chat-200`을 응답하고 도구를 호출할 수 있는 경우에만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키 또는 죽은 제공자는 추가되지 않고 제거됩니다. 언제든지 검증 단계를 다시 실행하세요;
> 실패는 보고되며 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 가입 | `POST /api/user/register {username,password}` | 이메일 필드 없음; 5xx는 2.5초 후 재시도, 그다음 주소와 함께 호출 재시도 |
| 로그인 | `POST /api/user/login {username,password}` | `access_token`, 그리고 쿠키만 반환하는 포크를 위한 세션 쿠키 |
| 계정 | `GET /api/user/self` | id + 쿼터 |
| 가격 | `GET /api/pricing` | 가장 저렴한 채팅 모델과 그 `enable_groups[0]` — 토큰이 있어야 할 그룹 |
| 키 | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; 응답하게 만드는 것은 그룹 |
| 점검 | `POST /v1/chat/completions` | `keys.txt` 이전에 라이브 200 필요; 429는 속도 신호 (2.5초 대기, 같은 모델 재시도) |

## ⚙️ CLI 옵션

```bash
node src/cli.js [mode] [flags]
```

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count N` | 10 | 민트할 계정 (= 키) 수 |
| `--conc N` | 2 | 동시 진행 계정 (최대 16) — 워커당 하나의 출구가 고정됨 |
| `--host <name>` | `xlapis.com` | 패널 호스트 (동일한 레일이 이 패널의 미러에서 실행됨) |
| `--model <id>` | 가장 저렴한 가격 | 게이트를 하나의 모델 id로 고정 |
| `--group <name>` | 모델의 그룹 | 토큰 그룹 고정 |
| `--pool <file>` | `proxies.txt` | 프록시 목록 (`XLAPIS_PROXIES` 환경 변수도 작동) |
| `--gap MS` | 800 | 한 계정 내 모델 간 일시정지 |
| `--tries N` | 2 | 계정당 시도할 출구 수 |

스크리닝된 목록은 뒤에 메모를 포함할 수 있습니다 (`http://host:port 1.2.3.4`) — 로더는 첫 번째 열만 유지합니다.

## 🛰️ 프록시 뒤에서

**선택 사항 — 대규모에서는 권장 (IP별 제한, 차단).** 이 도구는 프록시 없이도 작동합니다.

- **풀이 있는 경우:** `--pool <file>`을 전달하거나 (`XLAPIS_PROXIES` 설정) 모든 요청이 해당 목록의 출구를 통해 나갑니다 — **하나의 계정은 전체 수명 동안 하나의 출구에 머뭅니다** (패널이 세션을 IP에 바인딩함), 그리고 죽은 회선은 해당 시도를 실패시켜 도구가 다음으로 이동합니다.
- **풀이 없는 경우:** CLI는 `running WITHOUT a proxy (direct)`를 출력하고 직접 연결합니다. 등록, 키 민트 또는 채팅 게이트에 관해서는 아무것도 바뀌지 않습니다 — 패킷이 나가는 위치만 바뀝니다.
- 두 모드 모두에 대해 `--screen`을 실행하세요: 실제 실행 전에 보유한 출구(또는 직접 경로)를 패널에 대해 테스트합니다.

운영자의 플릿에서 측정: 23개 출구 중 18개가 패널에 도달할 수 있었고, conc 2에서 3개 계정이 **72초 만에 검증된 작동 키를 생성**했습니다 (≈키당 20초).

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | chat-200 키, 한 줄에 하나 — git-ignored |
| `keys-ungated.txt` | 마지막 `--verify-only` 검사에 실패한 키 — 나중에 재시도 |
| `accounts.json` | 계정별 username / quota / group / model / chat status — git-ignored |
| `proxies.txt` | 출구 목록 — git-ignored |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다. 한 명령으로 `keys.txt`를 작동하는 조합이 있는 프로바이더 노드로 변환합니다:

```bash
node src/connect-9router.js
```

기본값: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다. 한 명령으로 `keys.txt`를 작동하는 조합이 있는 프로바이더 노드로 변환합니다:

```bash
node src/connect-omniroute.js
```

기본값: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 하나의 키로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 제공자가 주는 것 | 키당 하나의 계정 — 메일함 없는 가입, 그룹 바인딩된 토큰, 모든 키가 채팅 검증됨 |
| 🔑 하나의 키로 얻는 것 | 자체 계정에 범위가 지정된 하나의 API 키: 아래 엔드포인트의 16개 모델 id, 플랜의 한도 내에서. 쿼터는 **계정**에 있으므로, 이 도구가 키당 하나의 계정을 생성하는 것입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 데이터 | xlapis.com과 구성한 inbox 백엔드만 접촉됩니다; 키는 사용자의 컴퓨터에 남습니다 |

## 🐞 이슈

패널이 문, 그룹 목록 또는 채널 맵을 변경하면, 도구는 해당 단계에서 멈추고 그렇게 알립니다 (`--probe`가 보이는 것을 표시). 실행한 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**; PR을 환영합니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>