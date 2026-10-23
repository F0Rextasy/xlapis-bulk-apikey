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

**Crie contas Xlapis em massa com chaves de API geradas automaticamente — inferência compatível com OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-16%20served-412991?style=for-the-badge)](https://xlapis.com/pricing)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Nível gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-16-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

Xlapis é um painel New-API cuja porta é **"nofield"**: `POST /api/user/register` recebe um nome de usuário e uma senha e **nenhuma caixa de correio** (`GET /api/status` → `email_verification: false`, `turnstile_check: false`). A pegadinha está do outro lado da porta — o grupo `default` **não tem canal** para os modelos baratos, então um token criado ali responde `503 No available channel for model … under group default`. Esta ferramenta, portanto, **vincula o token ao próprio grupo do modelo** (`enable_groups[0]` de `/api/pricing`) e percorre os modelos de preço mais baixo até que o chat responda 200. A unidade que escala é *uma conta por chave*: chaves na frota do operador (60 da linha de produção, 3 cunhadas pela CLI fornecida enquanto era verificada), cada uma comprovada por uma chamada de chat ao vivo.

## 🎁 Nível gratuito — quanto você recebe

**Sem caixa de correio, sem captcha** — a conta é a parte gratuita, e o token é criado com `unlimited_quota: true`.

| O quê | Valor |
| --- | --- |
| Cartão exigido | **Não** |
| Captcha / Turnstile | **nenhum** (`turnstile_check: false`) |
| Caixa de correio | **não usada** — a chamada de registro envia apenas `{username, password}` |
| Crédito de cadastro | medido **500** de cota da conta em 3 contas cunhadas pela CLI (≈ $0.001 — o portão roda em `unlimited_quota`, não no crédito) |
| Portão de canal | o modelo deve ser solicitado em um grupo que o sirva; `default` responde `503` |
| A unidade que escala | **uma conta = uma chave** → `--count N` é "N contas" |

> 💡 O nível gratuito é definido pela Xlapis e pode mudar. Confira os números ao vivo em [xlapis.com](https://xlapis.com) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 16

O painel precifica **18 ids**, dos quais **16 são compatíveis com chat e carregam um grupo habilitado** (dois ids de vídeo `seedance-*` no grupo `视频模型` são ignorados — um filtro apenas por nome os percorre primeiro e desperdiça a conta). Apenas ids que responderam um **200** ao vivo com uma chave real estão listados:

| ID do modelo | ✓ | Grupo | Notas |
| --- | --- | --- | --- |
| `deepseek-v4.1-flash` | ✓ | `Deepseek-CHAT-周卡日卡专区1` | o id de chat mais barato — o portão para aqui em todas as contas |

Ids que o painel oferece com um grupo habilitado - fixados um a um (chaves cada, --verify-only --model id) - e nenhum deles respondeu por si só: todas as chaves caíram para deepseek-v4.1-flash. Eles permanecem na ordem de fallback do portão e fora da tabela verificada. O grupo `default` não serve nenhum deles.

## 🧪 Como usar a API

```bash
curl https://xlapis.com/v1/chat/completions \
  -H "Authorization: Bearer <your key>" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4.1-flash","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🛠 Início rápido

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

`keys.txt` é escrito **somente** depois que uma conclusão de chat ao vivo comprova a chave.

| Modo | O que faz |
| --- | --- |
| `run` (padrão) | cunha contas até `--count`, valida cada chave com um chat ao vivo |
| `--verify-only` | revarre `keys.txt`, movendo qualquer coisa que falhe para `keys-ungated.txt` |
| `--screen` | testa sua lista de proxies (ou a rota direta) contra o painel → `proxies.live.txt` |
| `--probe` | verificação de ambiente: flags do painel, preços, ordem do portão, saídas |
| `--collect` | reconstrói `keys.txt` a partir de `accounts.json` (toda linha com `chat_status: 200`) |

### 🖱️ O launcher

O launcher pergunta pela lista de proxies, contagem e modelo, lembra-os em `launcher.config.json` e executa a CLI com as flags corretas.

## ✅ Verificado e funcionando — toda chave é testada

| Verificação | Resultado |
| --- | --- |
| `GET /api/status` | **200** — `XL API`, `password_register_enabled: true`, `email_verification: false`, `turnstile_check: false` |
| `GET /api/pricing` | **200** — 18 ids precificados, **16 compatíveis com chat com um grupo habilitado**; o id de chat mais barato é `deepseek-v4.1-flash` |
| `POST /api/user/register` | **200** `{username,password}` — sem caixa de correio, sem captcha (503 é repetido duas vezes, depois a chamada é repetida com um campo de e-mail) |
| `POST /api/user/login` | **200** — `access_token` (cookie + fallback `New-Api-User` para forks mais antigos) |
| `GET /api/user/self` | **200** — cota 500 em uma conta nova |
| `POST /api/token/` → `POST /api/token/<id>/key` | token criado **dentro do grupo do modelo**, chave em texto simples revelada |
| `POST /v1/chat/completions` — executado para **toda** chave antes de ser escrita | **200** com conteúdo real (`choices`, sem `error`) |
| uma chave que falha na verificação de chat | nunca escrita em `keys.txt` |

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser escrita em `keys.txt`
> (chaves mortas nunca são entregues). As combinações do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca ocultadas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Xlapis page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://xlapis.com/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Notas |
| --- | --- | --- |
| cadastro | `POST /api/user/register {username,password}` | sem campo de e-mail; um 5xx é repetido após 2,5 s, depois a chamada é repetida com um endereço |
| login | `POST /api/user/login {username,password}` | `access_token`, mais o cookie de sessão para forks que só retornam um cookie |
| conta | `GET /api/user/self` | id + cota |
| preços | `GET /api/pricing` | modelo de chat mais barato e seu `enable_groups[0]` — o grupo em que o token deve viver |
| chave | `POST /api/token/ {group}` → `POST /api/token/<id>/key` | `unlimited_quota: true`; o grupo é o que faz responder |
| verificação | `POST /v1/chat/completions` | 200 ao vivo exigido antes de `keys.txt`; um 429 é um sinal de ritmo (espere 2,5 s, repita o mesmo modelo) |

## ⚙️ Opções da CLI

```bash
node src/cli.js [mode] [flags]
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count N` | 10 | contas (= chaves) a cunhar |
| `--conc N` | 2 | contas em andamento (máx 16) — uma saída é fixada por worker |
| `--host <name>` | `xlapis.com` | host do painel (a mesma linha roda em espelhos deste painel) |
| `--model <id>` | mais barato precificado | fixa o portão a um id de modelo |
| `--group <name>` | o grupo do modelo | fixa o grupo do token |
| `--pool <file>` | `proxies.txt` | lista de proxies (a variável de ambiente `XLAPIS_PROXIES` também funciona) |
| `--gap MS` | 800 | pausa entre modelos dentro de uma conta |
| `--tries N` | 2 | saídas tentadas por conta |

Uma lista filtrada pode carregar uma nota à direita (`http://host:port 1.2.3.4`) — o carregador mantém a primeira coluna.

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta funciona sem proxy também.

- **Com um pool:** passe `--pool <file>` (ou defina `XLAPIS_PROXIES`) e toda requisição passa por uma saída dessa lista — **uma conta vive em uma saída** por toda a sua vida (o painel vincula a sessão ao IP), e uma linha morta faz aquela tentativa falhar, então a ferramenta passa para a próxima.
- **Sem um pool:** a CLI imprime `running WITHOUT a proxy (direct)` e conecta diretamente. Nada sobre registro, cunhagem de chaves ou o portão de chat muda — apenas de onde os pacotes saem.
- Execute `--screen` contra qualquer um dos modos: ele testa as saídas que você tem (ou a rota direta) contra o painel antes de uma execução real.

Medido na frota do operador: 18 de 23 saídas conseguiram alcançar o painel, e 3 contas em conc 2 produziram **chaves verificadas e funcionando em 72 s** (≈20 s/chave).

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | chaves chat-200, uma por linha — ignorado pelo git |
| `keys-ungated.txt` | chaves que falharam na última varredura `--verify-only` — tente novamente depois |
| `accounts.json` | nome de usuário / cota / grupo / modelo / status de chat por conta — ignorado pelo git |
| `proxies.txt` | sua lista de saídas — ignorado pelo git |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó provedor com combinações funcionais:

```bash
node src/connect-9router.js
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI. Um comando transforma `keys.txt` em um nó provedor com combinações funcionais:

```bash
node src/connect-omniroute.js
```

Padrões: `--base http://localhost:20128`, `--password 123456`, `--name "Xlapis"`, `--prefix xlapis`, `--base-url https://xlapis.com/v1`.

## 🔑 O que uma chave lhe dá

| | |
| --- | --- |
| 🏢 Provedor | **Xlapis** — [xlapis.com](https://xlapis.com) |
| 🎁 O que o provedor dá | uma conta por chave — cadastro sem caixa de correio, token vinculado a grupo, toda chave verificada por chat |
| 🔑 O que uma chave lhe dá | uma chave de API limitada à sua própria conta: os 16 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota vive na **conta**, que é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://xlapis.com/v1/chat/completions` |
| 🔒 Seus dados | apenas xlapis.com e o backend de caixa de entrada que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

Se o painel mudar sua porta, sua lista de grupos ou seu mapa de canais, a ferramenta para nessa etapa e avisa (`--probe` mostra o que ela vê). **[Abra uma issue](../../issues)** com o comando que você executou e a saída exata; PRs são bem-vindos.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 xlapis-bulk-apikey contributors

</div>