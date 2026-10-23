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

**Массовое создание аккаунтов Xlapis с автоматически сгенерированными API-ключами — инференс, совместимый с OpenAI, + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-16-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

Xlapis — это панель New-API, дверь которой — **«nofield»**: `POST /api/user/register` принимает имя пользователя и пароль и **вообще не требует почтового ящика** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). Подвох на другой стороне двери — у группы `default` **нет канала** для дешёвых моделей, поэтому токен, созданный там, отвечает `503 No available channel for model … under group default`. Поэтому этот инструмент **привязывает токен к собственной группе модели** (`enable_groups[0]` из `/api/pricing`) и перебирает самые дешёвые по цене модели, пока чат не ответит 200. Единица масштабирования — *один аккаунт на ключ*: ключи на парке оператора (60 из линии выпуска, 3 выпущены поставляемым CLI во время его проверки), каждый подтверждён живым вызовом чата.

## 🎁 Бесплатный тариф — сколько вы получаете

**Без почтового ящика, без капчи** — аккаунт и есть бесплатная вещь, а токен создаётся с `unlimited_quota: true`.

| Что | Значение |
| --- | --- |
| Требуется карта | **Нет** |
| Капча / Turnstile | **нет** (`turnstile_check: false`) |
| Почтовый ящик | **не используется** — запрос регистрации отправляет только `{username, password}` |
| Приветственный кредит | измерено **500** квоты аккаунта на 3 аккаунтах, выпущенных CLI (≈ $0.001 — гейт работает на `unlimited_quota`, а не на кредите) |
| Гейт канала | модель нужно запрашивать в группе, которая её обслуживает; `default` отвечает `503` |
| Единица масштабирования | **один аккаунт = один ключ** → `--count N` означает «N аккаунтов» |

> 💡 Бесплатный тариф устанавливается Xlapis и может измениться. Проверяйте актуальные цифры на [xlapis.com](https://xlapis.com) — и пусть собственный гейт инструмента решает:

```bash
node src/cli.js --verify-only     # каждый ключ в keys.txt перепроверяется реальным вызовом чата
```

## 🤖 Модели — все 16

Панель оценивает **18 id**, из которых **16 поддерживают чат и имеют включённую группу** (два видео-id `seedance-*` в группе `视频模型` пропускаются — фильтр только по имени перебирает их первыми и тратит аккаунт). Перечислены только id, ответившие живым **200** с реальным ключом:

| ID модели | ✓ | Группа | Примечания |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | самый дешёвый чат-id — гейт останавливается здесь на каждом аккаунте |

Id, которые панель предлагает с включённой группой — закреплены по одному (ключи каждый, --verify-only --model id) — и ни один из них не ответил сам по себе: каждый ключ проваливался до deepseek-v4.1-flash. Они остаются в порядке отката гейта и вне проверенной таблицы. Группа `default` не обслуживает ни один из них.

## 🧪 Как использовать API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Быстрый старт

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

`keys.txt` записывается **только** после того, как живое завершение чата подтвердит ключ.

| Режим | Что делает |
| --- | --- |
| `run` (по умолчанию) | выпускает аккаунты до `--count`, проверяет каждый ключ живым чатом |
| `--verify-only` | повторно проходит по `keys.txt`, перемещая всё, что не прошло, в `keys-ungated.txt` |
| `--screen` | тестирует ваш список прокси (или прямое соединение) против панели → `proxies.live.txt` |
| `--probe` | проверка окружения: флаги панели, цены, порядок гейта, выходы |
| `--collect` | пересобирает `keys.txt` из `accounts.json` (каждая строка с `chat_status: 200`) |

### 🖱️ Лаунчер

Лаунчер запрашивает список прокси, количество и модель, запоминает их в `launcher.config.json` и запускает CLI с нужными флагами.

## ✅ Проверено в работе — каждый ключ протестирован

| Проверка | Результат |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 оценённых id, **16 поддерживают чат с включённой группой**; самый дешёвый чат-id — `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — без почтового ящика, без капчи (503 повторяется дважды, затем вызов повторяется с полем e-mail) |
| `POST /api/user/login` | **200** — `access_token` (cookie + `New-Api-User` как запасной вариант для старых форков) |
| `GET /api/user/self` | **200** — квота 500 на свежем аккаунте |
| `POST /api/token/` → `POST /api/token/<id>/key` | токен создан **внутри группы модели**, открытый ключ раскрыт |
| `POST /v1/chat/completions` — запускается для **каждого** ключа перед записью | **200** с реальным содержимым (`choices`, без `error`) |
| ключ, не прошедший проверку чата | никогда не записывается в `keys.txt` |

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200` перед записью в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Перезапускайте шаг проверки в любое время;
> сбои сообщаются, а не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| регистрация | `POST /api/user/register {username,password}` | без поля e-mail; 5xx повторяется через 2.5 с, затем вызов повторяется с адресом |
| вход | `POST /api/user/login {username,password}` | `access_token`, плюс сессионная cookie для форков, которые возвращают только cookie |
| аккаунт | `GET /api/user/self` | id + квота |
| цены | `GET /api/pricing` | самая дешёвая чат-модель и её `enable_groups[0]` — группа, в которой должен находиться токен |
| ключ | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; именно группа заставляет его отвечать |
| проверка | `POST /v1/chat/completions` | требуется живой 200 перед `keys.txt`; 429 — сигнал темпа (подождать 2.5 с, повторить ту же модель) |

## ⚙️ Опции CLI

```bash
node src/cli.js [mode] [flags]
```

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count N` | 10 | аккаунтов (= ключей) для выпуска |
| `--conc N` | 2 | аккаунтов в работе (макс. 16) — один выход закреплён за каждым воркером |
| `--host <name>` | `xlapis.com` | хост панели (та же линия работает на зеркалах этой панели) |
| `--model <id>` | самый дешёвый по цене | закрепить гейт за одним id модели |
| `--group <name>` | группа модели | закрепить группу токена |
| `--pool <file>` | `proxies.txt` | список прокси (переменная окружения `XLAPIS_PROXIES` тоже работает) |
| `--gap MS` | 800 | пауза между моделями внутри одного аккаунта |
| `--tries N` | 2 | выходов, испробованных на аккаунт |

Отфильтрованный список может содержать примечание в конце (`http://host:port 1.2.3.4`) — загрузчик оставляет первый столбец.

## 🛰️ За прокси

**Необязательно — рекомендуется при масштабе (лимиты на IP, баны).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `XLAPIS_PROXIES`), и каждый запрос идёт через выход из этого списка — **один аккаунт живёт на одном выходе** всю свою жизнь (панель привязывает сессию к IP), а мёртвая линия проваливает эту попытку, и инструмент переходит к следующей.
- **Без пула:** CLI выводит `running WITHOUT a proxy (direct)` и подключается напрямую. Ничего в регистрации, выпуске ключей или гейте чата не меняется — только то, откуда уходят пакеты.
- Запустите `--screen` для любого режима: он тестирует имеющиеся у вас выходы (или прямое соединение) против панели перед реальным запуском.

Измерено на парке оператора: 18 из 23 выходов смогли достичь панели, и 3 аккаунта при conc 2 дали **проверенные рабочие ключи за 72 с** (≈20 с/ключ).

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | ключи с chat-200, по одному в строке — игнорируется git |
| `keys-ungated.txt` | ключи, не прошедшие последний проход `--verify-only` — повторите позже |
| `accounts.json` | имя пользователя / квота / группа / модель / статус чата для каждого аккаунта — игнорируется git |
| `proxies.txt` | ваш список выходов — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый роутер, совместимый с OpenAI. Одна команда превращает `keys.txt` в узел-провайдер с рабочими комбинациями:

```bash
node src/connect-9router.js
```

По умолчанию: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый роутер, совместимый с OpenAI. Одна команда превращает `keys.txt` в узел-провайдер с рабочими комбинациями:

```bash
node src/connect-omniroute.js
```

По умолчанию: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 Что даёт провайдер | один аккаунт на ключ — регистрация без почтового ящика, токен, привязанный к группе, каждый ключ проверен чатом |
| 🔑 Что даёт один ключ | один API-ключ, привязанный к собственному аккаунту: 16 id моделей на указанном ниже эндпоинте, в пределах лимитов вашего тарифа. Квота живёт на **аккаунте**, и именно поэтому этот инструмент создаёт один аккаунт на ключ |
| 🌐 Форма API | Совместим с OpenAI: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Ваши данные | связь только с xlapis.com и настроенным вами бэкендом почтового ящика; ключи остаются на вашей машине |

## 🐞 Проблемы

Если панель изменит свою дверь, список групп или карту каналов, инструмент остановится на этом шаге и сообщит об этом (`--probe` показывает, что он видит). **[Откройте issue](../../issues)** с командой, которую вы запустили, и точным выводом; PR приветствуются.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>