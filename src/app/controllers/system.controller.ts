import { useEffect, useState } from "react";
import type { AppInfo } from "../models";
import { systemService } from "../services";

/** Controller da tela Home: só lê as informações do runtime. */
export function useSystemController() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    systemService
      .info()
      .then(setInfo)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : String(cause)),
      );
  }, []);

  return { info, error };
}
