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

**Créez en masse des comptes Xlapis avec des clés API générées automatiquement — inférence compatible OpenAI + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-16-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cet outil existe

Xlapis est un panneau New-API dont la porte est de type **« nofield »** : `POST /api/user/register` prend un nom d'utilisateur et un mot de passe et **aucune boîte mail** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). Le piège se trouve de l'autre côté de la porte — le groupe `default` n'a **aucun canal** pour les modèles bon marché, donc un jeton créé là répond `503 No available channel for model … under group default`. Cet outil **lie donc le jeton au groupe propre du modèle** (`enable_groups[0]` issu de `/api/pricing`) et parcourt les modèles les moins chers jusqu'à ce que le chat réponde 200. L'unité qui monte en charge est *un compte par clé* : 63 clés sur le parc de l'opérateur (60 issues de la chaîne de création, 3 créées par le CLI fourni lors de sa vérification), chacune prouvée par un appel de chat réel.

## 🎁 Offre gratuite — ce que vous obtenez

**Pas de boîte mail, pas de captcha** — le compte est la ressource gratuite, et le jeton est créé avec `unlimited_quota: true`.

| Élément | Valeur |
| --- | --- |
| Carte bancaire requise | **Non** |
| Captcha / Turnstile | **aucun** (`turnstile_check: false`) |
| Boîte mail | **non utilisée** — l'appel d'inscription envoie uniquement `{username, password}` |
| Crédit d'inscription | mesuré à **500** de quota de compte sur 3 comptes créés par le CLI (≈ 0,001 $ — la porte repose sur `unlimited_quota`, pas sur le crédit) |
| Filtre de canal | le modèle doit être demandé dans un groupe qui le sert ; `default` répond `503` |
| L'unité qui monte en charge | **un compte = une clé** → `--count N` signifie « N comptes » |

> 💡 L'offre gratuite est définie par Xlapis et peut changer. Consultez les chiffres en direct sur [xlapis.com](https://xlapis.com) — et laissez la porte de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 16 au complet

Le panneau tarifie **18 identifiants**, dont **16 sont compatibles chat et portent un groupe activé** (deux identifiants vidéo `seedance-*` dans le groupe `视频模型` sont ignorés — un filtre sur le nom seul les parcourt en premier et gaspille le compte). Seuls les identifiants ayant répondu un **200** réel avec une vraie clé sont listés :

| ID du modèle | ✓ | Groupe | Remarques |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | l'identifiant chat le moins cher — la porte s'arrête ici sur chaque compte |

Identifiants que le panneau propose avec un groupe activé — épinglés un par un (3 clés chacun, --verify-only --model id) — et aucun n'a répondu de lui-même : chaque clé est retombée sur deepseek-v4.1-flash. Ils restent dans l'ordre de repli de la porte et hors du tableau vérifié. Le groupe `default` n'en sert aucun.

## 🧪 Comment utiliser l'API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Démarrage rapide

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

`keys.txt` n'est écrit **qu'**après qu'une complétion de chat réelle a prouvé la clé.

| Mode | Ce qu'il fait |
| --- | --- |
| `run` (par défaut) | crée des comptes jusqu'à `--count`, filtre chaque clé avec un chat réel |
| `--verify-only` | re-parcourt `keys.txt`, déplace tout ce qui échoue vers `keys-ungated.txt` |
| `--screen` | teste votre liste de proxys contre le panneau → `proxies.live.txt` |
| `--probe` | vérification de l'environnement : indicateurs du panneau, tarification, ordre de la porte, sorties |
| `--collect` | reconstruit `keys.txt` à partir de `accounts.json` (chaque ligne `chat_status: 200`) |

### 🖱️ Le lanceur

Le lanceur demande la liste de proxys, le nombre et le modèle, les mémorise dans `launcher.config.json`, et exécute le CLI avec les bons drapeaux.

## ✅ Vérifié fonctionnel — chaque clé est testée

| Vérification | Résultat |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 identifiants tarifés, **16 compatibles chat avec un groupe activé** ; l'identifiant chat le moins cher est `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — pas de boîte mail, pas de captcha (503 est réessayé deux fois, puis l'appel est réessayé avec un champ e-mail) |
| `POST /api/user/login` | **200** — `access_token` (cookie + repli `New-Api-User` pour les anciens forks) |
| `GET /api/user/self` | **200** — quota 500 sur un compte neuf |
| `POST /api/token/` → `POST /api/token/<id>/key` | jeton créé **dans le groupe du modèle**, clé en clair révélée |
| `POST /v1/chat/completions` — exécuté pour **chaque** clé avant son écriture | **200** avec du contenu réel (`choices`, pas d'`error`) |
| une clé qui échoue à sa vérification de chat | jamais écrite dans `keys.txt` |

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Remarques |
| --- | --- | --- |
| inscription | `POST /api/user/register {username,password}` | pas de champ e-mail ; un 5xx est réessayé après 2,5 s, puis l'appel est réessayé avec une adresse |
| connexion | `POST /api/user/login {username,password}` | `access_token`, plus le cookie de session pour les forks qui ne renvoient qu'un cookie |
| compte | `GET /api/user/self` | id + quota |
| tarification | `GET /api/pricing` | modèle chat le moins cher et son `enable_groups[0]` — le groupe dans lequel le jeton doit vivre |
| clé | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true` ; c'est le groupe qui lui permet de répondre |
| vérification | `POST /v1/chat/completions` | un 200 réel est requis avant `keys.txt` ; un 429 est un signal de rythme (attendre 2,5 s, réessayer le même modèle) |

## ⚙️ Options du CLI

```bash
node src/cli.js [mode] [flags]
```

| Drapeau | Défaut | Signification |
| --- | --- | --- |
| `--count N` | 10 | comptes (= clés) à créer |
| `--conc N` | 2 | comptes en cours (max 16) — une sortie est épinglée par worker |
| `--host <name>` | `xlapis.com` | hôte du panneau (la même chaîne fonctionne sur les miroirs de ce panneau) |
| `--model <id>` | le moins cher tarifé | épingle la porte à un seul identifiant de modèle |
| `--group <name>` | le groupe du modèle | épingle le groupe du jeton |
| `--pool <file>` | `proxies.txt` | liste de proxys (la variable d'env `XLAPIS_PROXIES` fonctionne aussi) |
| `--gap MS` | 800 | pause entre les modèles au sein d'un même compte |
| `--tries N` | 2 | sorties essayées par compte |

Une liste filtrée peut comporter une note en fin de ligne (`http://host:port 1.2.3.4`) — le chargeur conserve la première colonne.

## 🛰️ Derrière un proxy

Chaque requête sort via une sortie de votre pool — l'outil ne contacte jamais le panneau directement, et **un compte vit sur une seule sortie** pendant toute sa durée de vie (le panneau lie la session à l'IP). Mesuré sur le parc de l'opérateur : 18 sorties sur 23 pouvaient atteindre le panneau, et 3 comptes à conc 2 ont produit **3/3 clés actives en 72 s** (≈ 20 s/clé).

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | clés chat-200, une par ligne — ignoré par git |
| `keys-ungated.txt` | clés ayant échoué au dernier parcours `--verify-only` — à réessayer plus tard |
| `accounts.json` | nom d'utilisateur / quota / groupe / modèle / statut chat par compte — ignoré par git |
| `proxies.txt` | votre liste de sorties — ignoré par git |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI. Une seule commande transforme `keys.txt` en nœud fournisseur avec des combos fonctionnels :

```bash
node src/connect-9router.js
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI. Une seule commande transforme `keys.txt` en nœud fournisseur avec des combos fonctionnels :

```bash
node src/connect-omniroute.js
```

Valeurs par défaut : `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.
## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 Ce que le fournisseur donne | un compte par clé — inscription sans boîte mail, jeton lié à un groupe, chaque clé vérifiée par chat |
| 🔑 Ce qu'une clé vous apporte | une clé API limitée à son propre compte : les 16 identifiants de modèle sur le point de terminaison ci-dessous, dans les limites de votre offre. Le quota vit sur le **compte**, ce qui explique précisément pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Vos données | seuls xlapis.com et le backend de boîte mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

Si le panneau change sa porte, sa liste de groupes ou sa carte des canaux, l'outil s'arrête à cette étape et le signale (`--probe` montre ce qu'il voit). **[Ouvrez un ticket](../../issues)** avec la commande exécutée et la sortie exacte ; les PR sont bienvenues.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>