# yourself

App **Tauri 2 + React 19 + TypeScript** organizado em **MVC no estilo Angular**, com pacotes separados para **Desktop** (`apps/desktop`) e **Mobile** (`apps/mobile`), além do backend em **Docker + SQLite**.

## Estrutura do Monorepo

O projeto está organizado como um monorepo pnpm:

```
apps/
├── desktop/                 # Aplicação Tauri Desktop (Linux, macOS, Windows)
└── mobile/                  # Aplicação Tauri Mobile (Android / iOS) com plugin de Uso de Apps
services/
└── backend/                 # Serviço backend (Hono + Node.js + SQLite nativo em Docker)
.opencode/agents/architect.md # agent que entende essa arquitetura
```

## Arquitetura (MVC)

O fluxo é sempre em uma direção:

```
View  →  Controller  →  Service  →  comando Rust
```

| Camada | Caminho | Papel |
| --- | --- | --- |
| **View** | `src/app/views/**` | Componentes React. Só renderizam estado vindo do Controller. Nunca chamam `invoke()` nem importam Services. |
| **Controller** | `src/app/controllers/**` | Hooks que mantêm estado, chamam Services e devolvem estado + ações. Nunca importam `@tauri-apps/api`. |
| **Service** | `src/app/services/**` | Único ponto que conhece o Tauri — encapsula todos os `invoke()`. |
| **Model** | `src/app/models/**` + `src-tauri/src/lib.rs` | Contratos de dados espelhados entre TypeScript e Rust. |
| **Rotas** | `src/app/routes/**` | `paths.ts` (mapa central) + `AppRoutes.tsx` (componente de rotas). |

## Requisitos

Gerenciado com [mise](https://mise.jdx.dev/) (`~/.config/mise/config.toml`):

- `node 22`, `pnpm 12`, `java 21`, `rust latest`
- `ANDROID_HOME=~/android-sdk` (SDK + NDK 28 + build-tools 36)
- Targets Rust: `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`

## Comandos

```sh
mise x -- pnpm install        # dependências
mise x -- pnpm build          # valida tsc + bundle de desktop e mobile

# Desktop Dev
mise x -- pnpm dev:desktop

# Mobile (Android) Dev
mise x -- pnpm dev:mobile
```

### Backend (Docker + SQLite)

O serviço de backend (gerenciamento de perfis e agendamento de reuniões) roda de forma desacoplada do Cloudflare, utilizando **Docker** e **SQLite** nativo do Node.js (`node:sqlite`).

Para subir o backend:
```sh
pnpm docker:up      # Sobe o backend em segundo plano (porta 8787)
pnpm docker:logs    # Exibe os logs do backend
pnpm docker:down    # Para o serviço Docker
```

O arquivo do banco SQLite fica persistido no volume Docker `backend_data`.

## Agent

O projeto define o agent **`architect`** em `.opencode/agents/architect.md`, carregado como instrução em `opencode.json`. Ele conhece as cinco camadas e as regras de fluxo.
