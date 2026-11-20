import { invoke } from "@tauri-apps/api/core";
import type { AppUsage, UsageReport } from "../models";

/**
 * Service — único ponto do frontend que conhece os comandos de uso de apps.
 * Fala com os comandos Rust, que delegam ao plugin Kotlin no Android.
 */
class UsageService {
  checkPermission(): Promise<boolean> {
    return invoke<boolean>("check_usage_permission");
  }

  /** Abre as configurações do sistema; a concessão é feita pelo usuário. */
  requestPermission(): Promise<boolean> {
    return invoke<boolean>("request_usage_permission");
  }

  getAll(days: number): Promise<UsageReport> {
    return invoke<UsageReport>("get_all_app_usage", { days });
  }

  getOne(packageName: string, days: number): Promise<AppUsage | null> {
    return invoke<AppUsage | null>("get_app_usage", { packageName, days });
  }
}

export const usageService = new UsageService();
