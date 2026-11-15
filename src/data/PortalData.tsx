import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, type PortalConfig, type PublicPackage } from "../lib/api";

type Status = "loading" | "ready" | "error";

interface PortalDataValue {
  status: Status;
  packages: PublicPackage[];
  config: PortalConfig | null;
  reload: () => void;
}

const PortalDataContext = createContext<PortalDataValue | null>(null);

/** Loads what the portal needs to show: passes on sale and which payment methods work. */
export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    Promise.all([
      apiFetch<PublicPackage[]>("/public/packages", { signal: controller.signal }),
      apiFetch<PortalConfig>("/public/config", { signal: controller.signal }),
    ])
      .then(([pkgs, cfg]) => {
        setPackages(pkgs);
        setConfig(cfg);
        setStatus("ready");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setStatus("error");
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const value = useMemo(() => ({ status, packages, config, reload }), [status, packages, config, reload]);
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData(): PortalDataValue {
  const value = useContext(PortalDataContext);
  if (!value) throw new Error("usePortalData must be used inside PortalDataProvider");
  return value;
}
