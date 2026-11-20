/**
 * Model — espelha as structs `AppUsage` / `UsageReport` de
 * `src-tauri/src/lib.rs` e o JSON devolvido pelo plugin Kotlin.
 * Todos os tempos são milissegundos.
 */
export interface AppUsage {
  packageName: string;
  appName: string;
  /** Data URI PNG (`data:image/png;base64,...`) ou null se indisponível. */
  iconBase64: string | null;
  totalTimeInForeground: number;
  todayTimeInForeground: number;
  last7DaysTimeInForeground: number;
  lastTimeUsed: number;
}

export interface UsageReport {
  apps: AppUsage[];
  totalTodayMs: number;
}

/** Períodos aceitos pelo comando `get_all_app_usage`. */
export const USAGE_PERIODS = [
  { days: 1, label: "Hoje" },
  { days: 7, label: "Últimos 7 dias" },
  { days: 30, label: "Últimos 30 dias" },
] as const;

/** Formata milissegundos em texto curto: 1h, 1h 15min, 2d 3h. */
export function formatUsageTime(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const rest = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
  return `${rest}min`;
}

/** Data/hora da última utilização, ou "—" quando nunca foi registrada. */
export function formatLastUsed(timestamp: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString();
}
