# yourself

App **Tauri 2 + React 19 + TypeScript** organizado em **MVC no estilo Angular**,
com target **Android** configurado.

## Arquitetura

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

Exemplo real: a tela de tarefas usa `TasksView` → `useTasksController` →
`taskService` → comandos `list_tasks` / `add_task` / `toggle_task` / `remove_task`
em `src-tauri/src/lib.rs`.

## Estrutura

```
src/
├── main.tsx                  # bootstrap + HashRouter
├── App.tsx                   # shell (cabeçalho + navegação)
└── app/
    ├── routes/               # paths.ts e AppRoutes.tsx
    ├── views/                # home, tasks, about, not-found
    ├── controllers/          # hooks de orquestração
    ├── services/             # invoke() do Tauri
    └── models/               # tipos compartilhados
src-tauri/
├── src/lib.rs                # models + comandos Rust
└── gen/android/              # projeto Android (gerado)
.opencode/agents/architect.md # agent que entende essa arquitetura
```

## Requisitos

Gerenciado com [mise](https://mise.jdx.dev/) (`~/.config/mise/config.toml`):

- `node 22`, `pnpm 12`, `java 21`, `rust latest`
- `ANDROID_HOME=~/android-sdk` (SDK + NDK 28 + build-tools 36)
- Targets Rust: `aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`

## Comandos

```sh
mise x -- pnpm install        # dependências
mise x -- pnpm build          # valida tsc + bundle
mise x -- pnpm dev            # dev server do Vite (porta 1420)

# Android
mise x -- pnpm tauri android dev    # roda no emulador/dispositivo
mise x -- pnpm tauri android build  # gera o APK/AAB
```

### Emulador

```sh
~/android-sdk/emulator/emulator -avd yourself_api35 -gpu swiftshader_indirect
~/android-sdk/platform-tools/adb devices
```

AVD criado: `yourself_api35` (Pixel 6, Android 35, google_apis/x86_64).

### Desktop (opcional)

O build de desktop no Linux exige `webkit2gtk-4.1` e `javascriptcoregtk-4.1`
(instalar via `sudo pacman -S webkit2gtk-4.1` — requer sudo).

## Agent

O projeto define o agent **`architect`** em `.opencode/agents/architect.md`,
carregado como instrução em `opencode.json`. Ele conhece as cinco camadas e as
regras de fluxo — peça a ele para revisar ou gerar código seguindo o MVC.

```text
Use o architect para adicionar uma nova tela seguindo o MVC
```
