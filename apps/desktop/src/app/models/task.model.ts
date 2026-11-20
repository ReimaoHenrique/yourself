/**
 * Model — contrato de dados compartilhado entre frontend e backend.
 *
 * Espelha `src-tauri/src/lib.rs` (struct `Task`). Se o backend mudar,
 * este é o único arquivo do frontend que precisa acompanhar.
 */

export interface Task {
  id: number;
  title: string;
  done: boolean;
}

/** Payload aceito pela criação de uma tarefa. */
export interface CreateTaskDTO {
  title: string;
}

/** Filtros disponíveis na listagem. */
export type TaskFilter = "all" | "pending" | "done";

/** Informações do runtime, retornadas pelo comando `app_info`. */
export interface AppInfo {
  name: string;
  version: string;
  profile: string;
  os: string;
}
