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

### Uso de aplicativos (Android)

O plugin Kotlin `UsagePlugin` (`src-tauri/gen/android/app/src/main/java/.../UsagePlugin.kt`)
lê o `UsageStatsManager` e é registrado pelo plugin Rust `usage` em `src-tauri/src/lib.rs`.
Fluxo: `UsageView` → `useUsageController` → `usageService` → comandos
`check_usage_permission` / `request_usage_permission` / `get_all_app_usage` /
`get_app_usage` → Kotlin.

A permissão `PACKAGE_USAGE_STATS` é especial (protegida): o Android **nunca**
mostra diálogo de concessão para ela, mesmo estando declarada no
`AndroidManifest.xml`. O usuário precisa ligar o toggle manualmente em
**Configurações → Apps → Acesso aos dados de uso**. O app mostra o estado
"pendente", abre essa tela com `Settings.ACTION_USAGE_ACCESS_SETTINGS` e
verifica novamente ao voltar. No desktop os comandos retornam erro informativo.

Os tempos são milissegundos: total no período, hoje, últimos 7 dias e última
utilização. Ícones voltam como data URI PNG em `iconBase64`.

### Erro "Página web não disponível" no celular físico

Se o firewall da máquina bloquear conexões do celular para o IP da rede (o
`tauri android dev` troca o `devUrl` para esse IP por padrão), use o tunelamento
`adb reverse` do próprio CLI:

```sh
mise x -- pnpm tauri android dev --host 127.0.0.1
```

Isso faz o Vite escutar em `127.0.0.1:1420` e o WebView carregar
`http://127.0.0.1:1420`, que o CLI encaminha via `adb reverse tcp:1420 tcp:1420`.
Para o hot reload funcionar, encaminhe também a porta do HMR:

```sh
adb reverse tcp:1421 tcp:1421
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
