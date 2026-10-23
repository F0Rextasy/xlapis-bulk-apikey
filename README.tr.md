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

**Otomatik oluşturulan API anahtarlarıyla toplu Xlapis hesabı oluşturun — OpenAI uyumlu çıkarım + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-16-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

Xlapis, kapısı **"nofield"** olan bir New-API panelidir: `POST /api/user/register` bir kullanıcı adı ve bir parola alır ve **hiç posta kutusu almaz** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). İşin püf noktası kapının diğer tarafındadır — `default` grubunun ucuz modeller için **hiçbir kanalı yoktur**, bu yüzden orada oluşturulan bir token `503 No available channel for model … under group default` yanıtı verir. Bu araç bu nedenle **token'ı modelin kendi grubuna bağlar** (`/api/pricing`'den `enable_groups[0]`) ve sohbet 200 yanıtı verene kadar en ucuz fiyatlı modelleri dener. Ölçeklenen birim *anahtar başına bir hesaptır*: operatörün filosundaki anahtarlar (üretim hattından 60, doğrulanırken gönderilen CLI tarafından oluşturulan 3), her biri canlı bir sohbet çağrısıyla kanıtlanmıştır.

## 🎁 Ücretsiz katman — ne kadar elde edersiniz

**Posta kutusu yok, captcha yok** — hesap ücretsiz olan şeydir ve token `unlimited_quota: true` ile oluşturulur.

| Ne | Değer |
| --- | --- |
| Kart gerekli | **Hayır** |
| Captcha / Turnstile | **yok** (`turnstile_check: false`) |
| Posta kutusu | **kullanılmaz** — kayıt çağrısı yalnızca `{username, password}` gönderir |
| Kayıt kredisi | 3 CLI ile oluşturulan hesapta **500** hesap kotası ölçüldü (≈ $0.001 — geçit `unlimited_quota` üzerinde çalışır, kredi üzerinde değil) |
| Kanal geçidi | model, onu sunan bir grupta istenmelidir; `default` `503` yanıtı verir |
| Ölçeklenen birim | **bir hesap = bir anahtar** → `--count N` "N hesap" demektir |

> 💡 Ücretsiz katman Xlapis tarafından belirlenir ve değişebilir. Canlı sayıları [xlapis.com](https://xlapis.com) adresinden kontrol edin — ve aracın kendi geçidinin karar vermesine izin verin:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modeller — 16'sının tamamı

Panel **18 id** fiyatlandırır; bunlardan **16'sı sohbet yeteneklidir ve etkin bir grup taşır** (`视频模型` grubundaki iki `seedance-*` video id'si atlanır — yalnızca ada dayalı bir filtre önce onları dener ve hesabı boşa harcar). Yalnızca gerçek bir anahtarla canlı **200** yanıtı veren id'ler listelenmiştir:

| Model ID | ✓ | Grup | Notlar |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | en ucuz sohbet id'si — geçit her hesapta burada durur |

Panelin etkin bir grupla sunduğu id'ler - tek tek sabitlendi (her biri anahtarlarla, --verify-only --model id) - ve hiçbiri kendi başına yanıt vermedi: her anahtar deepseek-v4.1-flash'e düştü. Geçit yedek sırasında kalırlar ve doğrulanmış tablonun dışında kalırlar. `default` grubu hiçbirini sunmaz.

## 🧪 API nasıl kullanılır

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Hızlı başlangıç

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

`keys.txt` **yalnızca** canlı bir sohbet tamamlama anahtarı kanıtladıktan sonra yazılır.

| Mod | Ne yapar |
| --- | --- |
| `run` (varsayılan) | `--count` değerine kadar hesap oluşturur, her anahtarı canlı bir sohbetle geçitten geçirir |
| `--verify-only` | `keys.txt` dosyasını yeniden tarar, başarısız olanları `keys-ungated.txt` dosyasına taşır |
| `--screen` | proxy listenizi (veya doğrudan rotayı) panele karşı test eder → `proxies.live.txt` |
| `--probe` | ortam kontrolü: panel bayrakları, fiyatlandırma, geçit sırası, çıkışlar |
| `--collect` | `accounts.json` dosyasından `keys.txt` dosyasını yeniden oluşturur (her `chat_status: 200` satırı) |

### 🖱️ Başlatıcı

Başlatıcı proxy listesini, sayıyı ve modeli sorar, bunları `launcher.config.json` dosyasında hatırlar ve CLI'yi doğru bayraklarla çalıştırır.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

| Kontrol | Sonuç |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 fiyatlı id, **16'sı etkin grupla sohbet yetenekli**; en ucuz sohbet id'si `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — posta kutusu yok, captcha yok (503 iki kez yeniden denenir, ardından çağrı bir e-posta alanıyla yeniden denenir) |
| `POST /api/user/login` | **200** — `access_token` (eski fork'lar için cookie + `New-Api-User` yedeği) |
| `GET /api/user/self` | **200** — yeni bir hesapta kota 500 |
| `POST /api/token/` → `POST /api/token/<id>/key` | token **modelin grubu içinde** oluşturuldu, düz metin anahtar açığa çıkarıldı |
| `POST /v1/chat/completions` — yazılmadan önce **her** anahtar için çalıştırılır | gerçek içerikle **200** (`choices`, `error` yok) |
| sohbet kontrolünde başarısız olan bir anahtar | `keys.txt` dosyasına asla yazılmaz |

> **Kalite geçitleri.** Buradaki her anahtar, `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtı veriyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> başarısızlıklar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| kayıt | `POST /api/user/register {username,password}` | e-posta alanı yok; 5xx 2,5 sn sonra yeniden denenir, ardından çağrı bir adresle yeniden denenir |
| giriş | `POST /api/user/login {username,password}` | `access_token`, ayrıca yalnızca cookie döndüren fork'lar için oturum cookie'si |
| hesap | `GET /api/user/self` | id + kota |
| fiyatlandırma | `GET /api/pricing` | en ucuz sohbet modeli ve `enable_groups[0]` — token'ın içinde bulunması gereken grup |
| anahtar | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; yanıt vermesini sağlayan şey gruptur |
| kontrol | `POST /v1/chat/completions` | `keys.txt` öncesinde canlı 200 gerekir; 429 bir hız sinyalidir (2,5 sn bekleyin, aynı modeli yeniden deneyin) |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js [mode] [flags]
```

| Bayrak | Varsayılan | Anlamı |
| --- | --- | --- |
| `--count N` | 10 | oluşturulacak hesap (= anahtar) sayısı |
| `--conc N` | 2 | eşzamanlı hesap (en fazla 16) — her çalışan için bir çıkış sabitlenir |
| `--host <name>` | `xlapis.com` | panel ana bilgisayarı (aynı hat bu panelin yansımalarında çalışır) |
| `--model <id>` | en ucuz fiyatlı | geçidi tek bir model id'sine sabitler |
| `--group <name>` | modelin grubu | token grubunu sabitler |
| `--pool <file>` | `proxies.txt` | proxy listesi (`XLAPIS_PROXIES` ortam değişkeni de çalışır) |
| `--gap MS` | 800 | bir hesap içindeki modeller arasında duraklama |
| `--tries N` | 2 | hesap başına denenen çıkış sayısı |

Taranmış bir liste sonunda bir not taşıyabilir (`http://host:port 1.2.3.4`) — yükleyici ilk sütunu korur.

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir (IP başına sınırlar, yasaklamalar).** Araç proxy olmadan da çalışır.

- **Bir havuzla:** `--pool <file>` geçirin (veya `XLAPIS_PROXIES` ayarlayın) ve her istek o listeden bir çıkıştan geçer — **bir hesap tüm yaşamı boyunca bir çıkışta yaşar** (panel oturumu IP'ye bağlar) ve ölü bir hat o denemeyi başarısız kılar, böylece araç bir sonrakine geçer.
- **Havuz olmadan:** CLI `running WITHOUT a proxy (direct)` yazdırır ve doğrudan bağlanır. Kayıt, anahtar oluşturma veya sohbet geçidi hakkında hiçbir şey değişmez — yalnızca paketlerin nereden çıktığı değişir.
- Her iki moda karşı `--screen` çalıştırın: gerçek bir çalıştırmadan önce sahip olduğunuz çıkışları (veya doğrudan rotayı) panele karşı test eder.

Operatörün filosunda ölçüldü: 23 çıkıştan 18'i panele ulaşabildi ve conc 2'de 3 hesap **72 saniyede doğrulanmış çalışan anahtarlar** üretti (≈20 sn/anahtar).

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | chat-200 anahtarları, her satırda bir tane — git tarafından yok sayılır |
| `keys-ungated.txt` | son `--verify-only` taramasında başarısız olan anahtarlar — daha sonra yeniden deneyin |
| `accounts.json` | hesap başına kullanıcı adı / kota / grup / model / sohbet durumu — git tarafından yok sayılır |
| `proxies.txt` | çıkış listeniz — git tarafından yok sayılır |

## 🔌 9Router'a bağlanın

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Tek bir komut `keys.txt` dosyasını çalışan kombinasyonlara sahip bir sağlayıcı düğümüne dönüştürür:

```bash
node src/connect-9router.js
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔌 OmniRoute'a bağlanın

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir. Tek bir komut `keys.txt` dosyasını çalışan kombinasyonlara sahip bir sağlayıcı düğümüne dönüştürür:

```bash
node src/connect-omniroute.js
```

Varsayılanlar: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 Sağlayıcının verdikleri | anahtar başına bir hesap — posta kutusuz kayıt, gruba bağlı token, her anahtar sohbet ile doğrulanmış |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsamlanmış bir API anahtarı: aşağıdaki uç noktada 16 model id'si, planınızın sınırlarında. Kota **hesapta** yaşar, bu aracın anahtar başına bir hesap oluşturmasının nedeni tam da budur |
| 🌐 API şekli | OpenAI uyumlu: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca xlapis.com ve yapılandırdığınız gelen kutusu arka ucuyla iletişim kurulur; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

Panel kapısını, grup listesini veya kanal haritasını değiştirirse, araç o adımda durur ve bunu söyler (`--probe` ne gördüğünü gösterir). Çalıştırdığınız komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**; PR'lar memnuniyetle karşılanır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey katkıda bulunanlar

</div>