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

**Xlapis-Konten im Bulk erstellen mit automatisch generierten API-Schlüsseln — OpenAI-kompatible Inferenz + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenloser Tarif](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-16-of-them) · [🧪 Die API nutzen](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

Xlapis ist ein New-API-Panel, dessen Tür eine **„nofield"-Tür** ist: `POST /api/user/register` nimmt einen Benutzernamen und ein Passwort und **überhaupt keine Mailbox** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). Der Haken liegt auf der anderen Seite der Tür — die Gruppe `default` hat **keinen Kanal** für die günstigen Modelle, sodass ein dort erstelltes Token mit `503 No available channel for model … under group default` antwortet. Dieses Tool **bindet das Token daher an die Gruppe des Modells selbst** (`enable_groups[0]` aus `/api/pricing`) und geht die günstigsten bepreisten Modelle durch, bis der Chat mit 200 antwortet. Die Einheit, die skaliert, ist *ein Konto pro Schlüssel*: 63 Schlüssel auf der Flotte des Betreibers (60 aus der Mint-Rail, 3 vom mitgelieferten CLI erzeugt, während es verifiziert wurde), jeder einzelne durch einen Live-Chat-Aufruf bewiesen.

## 🎁 Kostenloser Tarif — wie viel du bekommst

**Keine Mailbox, kein Captcha** — das Konto ist das Kostenlose, und das Token wird mit `unlimited_quota: true` erstellt.

| Was | Wert |
| --- | --- |
| Karte erforderlich | **Nein** |
| Captcha / Turnstile | **keines** (`turnstile_check: false`) |
| Mailbox | **nicht verwendet** — der Register-Aufruf sendet nur `{username, password}` |
| Anmeldeguthaben | gemessene **500** Konto-Quota bei 3 vom CLI erzeugten Konten (≈ $0.001 — das Gate läuft über `unlimited_quota`, nicht über das Guthaben) |
| Kanal-Gate | das Modell muss in einer Gruppe angefragt werden, die es bedient; `default` antwortet mit `503` |
| Die Einheit, die skaliert | **ein Konto = ein Schlüssel** → `--count N` bedeutet „N Konten" |

> 💡 Der kostenlose Tarif wird von Xlapis festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [xlapis.com](https://xlapis.com) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 16

Das Panel bepreist **18 IDs**, von denen **16 chat-fähig sind und eine aktivierte Gruppe tragen** (zwei `seedance-*`-Video-IDs in der Gruppe `视频模型` werden übersprungen — ein reiner Namensfilter geht sie zuerst durch und verschwendet das Konto). Nur IDs, die mit einem echten Schlüssel live mit **200** geantwortet haben, sind aufgeführt:

| Modell-ID | ✓ | Gruppe | Hinweise |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | die günstigste Chat-ID — hier stoppt das Gate bei jedem Konto |

IDs, die das Panel mit einer aktivierten Gruppe anbietet – einzeln festgenagelt (je 3 Schlüssel, --verify-only --model id) – und keine von ihnen antwortete für sich selbst: jeder Schlüssel fiel auf deepseek-v4.1-flash durch. Sie bleiben in der Fallback-Reihenfolge des Gates und außerhalb der verifizierten Tabelle. Die Gruppe `default` bedient keine von ihnen.

## 🧪 Die API nutzen

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Schnellstart

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

`keys.txt` wird **erst** geschrieben, nachdem eine Live-Chat-Vervollständigung den Schlüssel beweist.

| Modus | Was er tut |
| --- | --- |
| `run` (Standard) | Konten erzeugen bis `--count`, jeden Schlüssel mit einem Live-Chat durch das Gate schicken |
| `--verify-only` | `keys.txt` erneut durchgehen und alles, was fehlschlägt, nach `keys-ungated.txt` verschieben |
| `--screen` | deine Proxy-Liste gegen das Panel testen → `proxies.live.txt` |
| `--probe` | Umgebungsprüfung: Panel-Flags, Preisgestaltung, Gate-Reihenfolge, Exits |
| `--collect` | `keys.txt` aus `accounts.json` neu aufbauen (jede Zeile mit `chat_status: 200`) |

### 🖱️ Der Launcher

Der Launcher fragt nach Proxy-Liste, Anzahl und Modell, merkt sie sich in `launcher.config.json` und führt das CLI mit den richtigen Flags aus.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

| Prüfung | Ergebnis |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 bepreiste IDs, **16 chat-fähig mit einer aktivierten Gruppe**; günstigste Chat-ID ist `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — keine Mailbox, kein Captcha (503 wird zweimal wiederholt, dann wird der Aufruf mit einem E-Mail-Feld wiederholt) |
| `POST /api/user/login` | **200** — `access_token` (Cookie + `New-Api-User`-Fallback für ältere Forks) |
| `GET /api/user/self` | **200** — Quota 500 bei einem frischen Konto |
| `POST /api/token/` → `POST /api/token/<id>/key` | Token **innerhalb der Gruppe des Modells** erstellt, Klartext-Schlüssel offengelegt |
| `POST /v1/chat/completions` — für **jeden** Schlüssel ausgeführt, bevor er geschrieben wird | **200** mit echtem Inhalt (`choices`, kein `error`) |
| ein Schlüssel, der seine Chat-Prüfung nicht besteht | wird nie in `keys.txt` geschrieben |

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| Registrierung | `POST /api/user/register {username,password}` | kein E-Mail-Feld; ein 5xx wird nach 2,5 s wiederholt, dann wird der Aufruf mit einer Adresse wiederholt |
| Login | `POST /api/user/login {username,password}` | `access_token`, plus das Session-Cookie für Forks, die nur ein Cookie zurückgeben |
| Konto | `GET /api/user/self` | ID + Quota |
| Preisgestaltung | `GET /api/pricing` | günstigstes Chat-Modell und seine `enable_groups[0]` — die Gruppe, in der das Token leben muss |
| Schlüssel | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; die Gruppe ist das, was ihn antworten lässt |
| Prüfung | `POST /v1/chat/completions` | Live-200 erforderlich vor `keys.txt`; ein 429 ist ein Tempо-Signal (2,5 s warten, dasselbe Modell erneut versuchen) |

## ⚙️ CLI-Optionen

```bash
node src/cli.js [mode] [flags]
```

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count N` | 10 | Konten (= Schlüssel), die erzeugt werden sollen |
| `--conc N` | 2 | Konten gleichzeitig in Bearbeitung (max. 16) — ein Exit ist pro Worker festgenagelt |
| `--host <name>` | `xlapis.com` | Panel-Host (dieselbe Rail läuft auf Mirrors dieses Panels) |
| `--model <id>` | günstigstes bepreistes | das Gate auf eine Modell-ID festnageln |
| `--group <name>` | die Gruppe des Modells | die Token-Gruppe festnageln |
| `--pool <file>` | `proxies.txt` | Proxy-Liste (die Umgebungsvariable `XLAPIS_PROXIES` funktioniert ebenfalls) |
| `--gap MS` | 800 | Pause zwischen Modellen innerhalb eines Kontos |
| `--tries N` | 2 | pro Konto versuchte Exits |

Eine gescreente Liste kann eine nachgestellte Notiz tragen (`http://host:port 1.2.3.4`) — der Loader behält die erste Spalte.

## 🛰️ Hinter einem Proxy

Jede Anfrage verlässt das System über einen Exit aus deinem Pool — das Tool wählt sich nie direkt zum Panel durch, und **ein Konto lebt auf einem Exit** für sein ganzes Leben (das Panel bindet die Sitzung an die IP). Gemessen auf der Flotte des Betreibers: 18 von 23 Exits konnten das Panel erreichen, und 3 Konten bei conc 2 erzeugten **3/3 Live-Schlüssel in 72 s** (≈20 s/Schlüssel).

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | Chat-200-Schlüssel, einer pro Zeile — von Git ignoriert |
| `keys-ungated.txt` | Schlüssel, die den letzten `--verify-only`-Durchlauf nicht bestanden haben — später erneut versuchen |
| `accounts.json` | Benutzername / Quota / Gruppe / Modell / Chat-Status pro Konto — von Git ignoriert |
| `proxies.txt` | deine Exit-Liste — von Git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router. Ein Befehl verwandelt `keys.txt` in einen Provider-Node mit funktionierenden Kombos:

```bash
node src/connect-9router.js
```

Standardwerte: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 Was der Anbieter gibt | ein Konto pro Schlüssel — mailboxfreie Registrierung, gruppengebundenes Token, jeder Schlüssel chat-verifiziert |
| 🔑 Was ein Schlüssel dir bringt | einen API-Schlüssel, der auf sein eigenes Konto beschränkt ist: die 16 Modell-IDs am unten stehenden Endpunkt, im Rahmen der Limits deines Tarifs. Die Quota liegt auf dem **Konto**, weshalb dieses Tool genau ein Konto pro Schlüssel erstellt |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Deine Daten | nur xlapis.com und das von dir konfigurierte Inbox-Backend werden kontaktiert; Schlüssel bleiben auf deinem Rechner |

## 🐞 Issues

Wenn das Panel seine Tür, seine Gruppenliste oder seine Kanalzuordnung ändert, stoppt das Tool an diesem Schritt und sagt es dir (`--probe` zeigt, was es sieht). **[Öffne ein Issue](../../issues)** mit dem Befehl, den du ausgeführt hast, und der exakten Ausgabe; PRs sind willkommen.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>