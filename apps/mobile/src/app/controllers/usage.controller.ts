import { useCallback, useEffect, useState } from "react";
import type { UsageReport } from "../models";
import { usageService } from "../services";

/** Controller da tela de uso de apps: orquestra o Service e expõe estado/ações. */
export function useUsageController() {
  const [report, setReport] = useState<UsageReport>({ apps: [], totalTodayMs: 0 });
  const [granted, setGranted] = useState(false);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await usageService.checkPermission();
      setGranted(permission);
      setReport(permission ? await usageService.getAll(days) : { apps: [], totalTodayMs: 0 });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Voltando das configurações do sistema, verifica novamente a permissão.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const openSettings = useCallback(async () => {
    await usageService.requestPermission();
  }, []);

  return {
    apps: report.apps,
    totalTodayMs: report.totalTodayMs,
    /** Permissão ainda não concedida — estado "pendente" para a View. */
    permissionPending: !loading && !granted && !error,
    granted,
    days,
    setDays,
    loading,
    error,
    refresh,
    openSettings,
  };
}

export type UsageController = ReturnType<typeof useUsageController>;
