import { invoke } from "@tauri-apps/api/core";
import type { AppInfo, CreateTaskDTO, Task } from "../models";

/**
 * Service — única porta de entrada para o backend Rust.
 *
 * Os Controllers nunca chamam `invoke` diretamente: sempre passam por aqui.
 * Isso mantém o acoplamento com o Tauri concentrado em um só lugar.
 */
class TaskService {
  list(): Promise<Task[]> {
    return invoke<Task[]>("list_tasks");
  }

  async create(dto: CreateTaskDTO): Promise<Task | null> {
    return invoke<Task | null>("add_task", { title: dto.title });
  }

  toggle(id: number): Promise<Task | null> {
    return invoke<Task | null>("toggle_task", { id });
  }

  remove(id: number): Promise<boolean> {
    return invoke<boolean>("remove_task", { id });
  }
}

class SystemService {
  info(): Promise<AppInfo> {
    return invoke<AppInfo>("app_info");
  }
}

export const taskService = new TaskService();
export const systemService = new SystemService();
