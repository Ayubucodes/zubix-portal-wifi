import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { ApiError, apiFetch, type ConnectResponse } from "../lib/api";
import { formatExpiry } from "../lib/format";
import { readStoredParams } from "../lib/omada";
import { Alert, Button, Panel, Spinner } from "./ui";

type Connection =
  | { kind: "connecting" }
  | { kind: "online" }
  | { kind: "notConfigured" }
  | { kind: "noDevice" }
  | { kind: "error"; message: string };

interface Props {
  title: string;
  packageName: string | null;
  expiresAt: string | null;
  subscriptionId: string | null;
}

function minutesLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000));
}

/** Shown after a payment or voucher succeeds. It also asks the API to let this phone onto the Wi-Fi. */
export function SuccessView({ title, packageName, expiresAt, subscriptionId }: Props) {
  const { t, lang } = useI18n();
  const params = useMemo(() => readStoredParams(), []);
  const canConnect = Boolean(params && subscriptionId);
  const [connection, setConnection] = useState<Connection>(canConnect ? { kind: "connecting" } : { kind: "noDevice" });
  const started = useRef(false);
  const [left, setLeft] = useState(() => minutesLeft(expiresAt));

  useEffect(() => {
    const id = window.setInterval(() => setLeft(minutesLeft(expiresAt)), 30_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const connect = useCallback(async () => {
    if (!params || !subscriptionId) return;
    setConnection({ kind: "connecting" });
    try {
      const result = await apiFetch<ConnectResponse>("/public/connect", {
        method: "POST",
        body: JSON.stringify({
          subscriptionId,
          clientMac: params.clientMac,
          apMac: params.apMac,
          ssidName: params.ssidName,
          radioId: params.radioId,
        }),
      });
      setConnection(result.status === "AUTHORIZED" ? { kind: "online" } : { kind: "notConfigured" });
    } catch (error) {
      setConnection({ kind: "error", message: error instanceof ApiError && error.status !== 0 ? error.message : t.connectError });
    }
  }, [params, subscriptionId, t.connectError]);

  useEffect(() => {
    if (canConnect && !started.current) {
      started.current = true;
      void connect();
    }
  }, [canConnect, connect]);

  const online = connection.kind === "online";

  return (
    <div className="space-y-4">
      <Panel className="rise-in text-center">
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${online || connection.kind !== "connecting" ? "bg-lagoon-700" : "bg-lagoon-100"}`}>
          <svg viewBox="0 0 24 24" className="size-8 text-white" fill="none" aria-hidden>
            <path className="draw-check" d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
        {packageName && <p className="mt-1 text-ink-950/65">{packageName}</p>}

        {expiresAt && (
          <div className="mt-5 rounded-xl bg-lagoon-50 px-4 py-4">
            <p className="text-sm text-lagoon-800">{t.activeUntil}</p>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums">{formatExpiry(expiresAt, lang)}</p>
            {left !== null && <p className="mt-1 text-sm text-ink-950/65 tabular-nums">{t.timeLeft(Math.floor(left / 60), left % 60)}</p>}
          </div>
        )}
      </Panel>

      {connection.kind === "connecting" && (
        <div role="status" className="flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-ink-950/75 ring-1 ring-ink-950/5">
          <Spinner className="size-5 text-lagoon-700" />
          {t.connecting}
        </div>
      )}

      {online && (
        <Panel className="space-y-3 text-center">
          <p className="font-display text-xl font-extrabold">{t.onlineTitle}</p>
          <p className="text-ink-950/65">{t.onlineBody}</p>
          {params?.redirectUrl && (
            <a
              href={params.redirectUrl}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-lagoon-700 px-5 text-base font-semibold text-white hover:bg-lagoon-800"
            >
              {t.startBrowsing}
            </a>
          )}
        </Panel>
      )}

      {connection.kind === "notConfigured" && <Alert tone="warning">{t.notConfigured}</Alert>}
      {connection.kind === "noDevice" && <Alert tone="info">{t.noDeviceInfo}</Alert>}
      {connection.kind === "error" && (
        <div className="space-y-3">
          <Alert>{connection.message}</Alert>
          <Button variant="secondary" onClick={() => void connect()}>
            {t.tryAgain}
          </Button>
        </div>
      )}
    </div>
  );
}
