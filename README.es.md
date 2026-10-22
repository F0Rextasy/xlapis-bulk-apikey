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

**Crea cuentas de Xlapis en masa con claves API autogeneradas — inferencia compatible con OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-16-of-them) · [🧪 Usa la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

Xlapis es un panel de New-API cuya puerta es una **"nofield"**: `POST /api/user/register` toma un nombre de usuario y una contraseña y **ningún buzón en absoluto** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). La trampa está al otro lado de la puerta — el grupo `default` **no tiene canal** para los modelos baratos, así que un token creado ahí responde `503 No available channel for model … under group default`. Esta herramienta por lo tanto **vincula el token al grupo propio del modelo** (`enable_groups[0]` de `/api/pricing`) y recorre los modelos de precio más bajo hasta que el chat responde 200. La unidad que escala es *una cuenta por clave*: 63 claves en la flota del operador (60 del riel de acuñación, 3 acuñadas por el CLI incluido mientras se verificaba), cada una probada por una llamada de chat en vivo.

## 🎁 Nivel gratuito — cuánto obtienes

**Sin buzón, sin captcha** — la cuenta es lo gratuito, y el token se crea con `unlimited_quota: true`.

| Qué | Valor |
| --- | --- |
| Tarjeta requerida | **No** |
| Captcha / Turnstile | **ninguno** (`turnstile_check: false`) |
| Buzón | **no se usa** — la llamada de registro envía solo `{username, password}` |
| Crédito de registro | medido **500** de cuota de cuenta en 3 cuentas acuñadas por CLI (≈ $0.001 — la puerta funciona con `unlimited_quota`, no con el crédito) |
| Puerta de canal | el modelo debe pedirse en un grupo que lo sirva; `default` responde `503` |
| La unidad que escala | **una cuenta = una clave** → `--count N` es "N cuentas" |

> 💡 El nivel gratuito lo define Xlapis y puede cambiar. Consulta los números en vivo en [xlapis.com](https://xlapis.com) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 16

El panel pone precio a **18 ids**, de los cuales **16 son aptos para chat y llevan un grupo habilitado** (dos ids de vídeo `seedance-*` en el grupo `视频模型` se omiten — un filtro solo por nombre los recorre primero y desperdicia la cuenta). Solo se listan los ids que respondieron un **200** en vivo con una clave real:

| ID del modelo | ✓ | Grupo | Notas |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | el id de chat más barato — la puerta se detiene aquí en cada cuenta |

Ids que el panel ofrece con un grupo habilitado - fijados uno por uno (3 claves cada uno, --verify-only --model id) - y ninguno de ellos respondió por sí mismo: cada clave cayó hasta deepseek-v4.1-flash. Permanecen en el orden de respaldo de la puerta y fuera de la tabla verificada. El grupo `default` no sirve ninguno de ellos.

## 🧪 Cómo usar la API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Inicio rápido

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

`keys.txt` se escribe **solo** después de que una finalización de chat en vivo demuestra la clave.

| Modo | Qué hace |
| --- | --- |
| `run` (predeterminado) | acuña cuentas hasta `--count`, valida cada clave con un chat en vivo |
| `--verify-only` | vuelve a revisar `keys.txt`, moviendo lo que falle a `keys-ungated.txt` |
| `--screen` | prueba tu lista de proxies contra el panel → `proxies.live.txt` |
| `--probe` | comprobación del entorno: indicadores del panel, precios, orden de la puerta, salidas |
| `--collect` | reconstruye `keys.txt` desde `accounts.json` (cada fila con `chat_status: 200`) |

### 🖱️ El lanzador

El lanzador pregunta por la lista de proxies, la cantidad y el modelo, los recuerda en `launcher.config.json` y ejecuta el CLI con los flags correctos.

## ✅ Verificado y funcionando — cada clave se prueba

| Comprobación | Resultado |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 ids con precio, **16 aptos para chat con un grupo habilitado**; el id de chat más barato es `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — sin buzón, sin captcha (el 503 se reintenta dos veces, luego la llamada se reintenta con un campo de correo) |
| `POST /api/user/login` | **200** — `access_token` (cookie + respaldo `New-Api-User` para forks antiguos) |
| `GET /api/user/self` | **200** — cuota 500 en una cuenta nueva |
| `POST /api/token/` → `POST /api/token/<id>/key` | token creado **dentro del grupo del modelo**, clave en texto plano revelada |
| `POST /v1/chat/completions` — ejecutado para **cada** clave antes de escribirse | **200** con contenido real (`choices`, sin `error`) |
| una clave que falla su comprobación de chat | nunca se escribe en `keys.txt` |

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| registro | `POST /api/user/register {username,password}` | sin campo de correo; un 5xx se reintenta tras 2.5 s, luego la llamada se reintenta con una dirección |
| inicio de sesión | `POST /api/user/login {username,password}` | `access_token`, más la cookie de sesión para forks que solo devuelven una cookie |
| cuenta | `GET /api/user/self` | id + cuota |
| precios | `GET /api/pricing` | el modelo de chat más barato y su `enable_groups[0]` — el grupo en el que debe vivir el token |
| clave | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; el grupo es lo que hace que responda |
| comprobación | `POST /v1/chat/completions` | se requiere un 200 en vivo antes de `keys.txt`; un 429 es una señal de ritmo (espera 2.5 s, reintenta el mismo modelo) |

## ⚙️ Opciones del CLI

```bash
node src/cli.js [mode] [flags]
```

| Flag | Predeterminado | Significado |
| --- | --- | --- |
| `--count N` | 10 | cuentas (= claves) a acuñar |
| `--conc N` | 2 | cuentas en vuelo (máx 16) — se fija una salida por worker |
| `--host <name>` | `xlapis.com` | host del panel (el mismo riel funciona en réplicas de este panel) |
| `--model <id>` | el de precio más bajo | fija la puerta a un id de modelo |
| `--group <name>` | el grupo del modelo | fija el grupo del token |
| `--pool <file>` | `proxies.txt` | lista de proxies (la variable de entorno `XLAPIS_PROXIES` también funciona) |
| `--gap MS` | 800 | pausa entre modelos dentro de una cuenta |
| `--tries N` | 2 | salidas probadas por cuenta |

Una lista filtrada puede llevar una nota al final (`http://host:port 1.2.3.4`) — el cargador conserva la primera columna.

## 🛰️ Detrás de un proxy

Cada solicitud sale a través de una salida de tu pool — la herramienta nunca marca directamente al panel, y **una cuenta vive en una salida** durante toda su vida (el panel vincula la sesión a la IP). Medido en la flota del operador: 18 de 23 salidas pudieron alcanzar el panel, y 3 cuentas a conc 2 produjeron **3/3 claves en vivo en 72 s** (≈20 s/clave).

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | claves con chat-200, una por línea — ignorado por git |
| `keys-ungated.txt` | claves que fallaron la última revisión `--verify-only` — reintentar más tarde |
| `accounts.json` | nombre de usuario / cuota / grupo / modelo / estado de chat por cuenta — ignorado por git |
| `proxies.txt` | tu lista de salidas — ignorado por git |

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un router autoalojado y compatible con OpenAI. Un comando convierte `keys.txt` en un nodo proveedor con combos funcionales:

```bash
node src/connect-9router.js
```

Predeterminados: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 Qué da el proveedor | una cuenta por clave — registro sin buzón, token vinculado a un grupo, cada clave verificada por chat |
| 🔑 Qué te da una clave | una clave API limitada a su propia cuenta: los 16 ids de modelo en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta xlapis.com y el backend de buzón que configures; las claves se quedan en tu máquina |

## 🐞 Problemas

Si el panel cambia su puerta, su lista de grupos o su mapa de canales, la herramienta se detiene en ese paso y lo indica (`--probe` muestra lo que ve). **[Abre un issue](../../issues)** con el comando que ejecutaste y la salida exacta; los PR son bienvenidos.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>