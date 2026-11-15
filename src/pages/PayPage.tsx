import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SuccessView } from "../components/SuccessView";
import { Alert, Button, Panel } from "../components/ui";
import { useI18n } from "../i18n";
import { ApiError, apiFetch, type PaymentStatusResponse } from "../lib/api";
import { formatTzs } from "../lib/format";
import { formatLocalPhone, maskPhone } from "../lib/phone";
import { readStore } from "../lib/storage";

const POLL_MS = 3000;
const SLOW_HINT_MS = 45_000;
const GIVE_UP_MS = 5 * 60_000;
const FAILED = new Set(["FAILED", "CANCELLED", "EXPIRED", "REFUNDED"]);

interface Checkout {
  packageId: string;
  phone: string;
}

function readCheckout(reference: string): Checkout | null {
  const raw = readStore(`zubix.checkout.${reference}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Checkout;
  } catch {
    return null;
  }
}

function ReferenceBox({ reference }: { reference: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard is often blocked in sign-in browsers; the reference stays visible */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-lagoon-50 px-4 py-3 ring-1 ring-inset ring-lagoon-600/20">
      <div className="min-w-0">
        <p className="text-sm text-lagoon-800">{t.reference}</p>
        <p className="truncate font-display text-lg font-extrabold tabular-nums tracking-wide">{reference}</p>
      </div>
      <button type="button" onClick={() => void copy()} className="min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold text-lagoon-800 ring-1 ring-inset ring-lagoon-600/30 hover:bg-white">
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

function PulseIcon() {
  return (
    <div className="relative mx-auto flex size-24 items-center justify-center" aria-hidden>
      <span className="pulse-ring absolute inset-0 rounded-full bg-lagoon-600/40" />
      <span className="pulse-ring absolute inset-0 rounded-full bg-lagoon-600/40 [animation-delay:1.2s]" />
      <span className="relative flex size-16 items-center justify-center rounded-full bg-lagoon-700 text-white">
        <svg viewBox="0 0 24 24" className="size-8" fill="none">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <path d="M10.5 18h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

/** Test mode only: lets a developer act as the customer without a real mobile money prompt. */
function MockPanel({ reference, onDone }: { reference: string; onDone: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const send = async (status: "SUCCESS" | "FAILED") => {
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/payments/dev/mock/${reference}/complete`, { method: "POST", body: JSON.stringify({ status }) });
      onDone();
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 404 ? t.mockUnavailable : (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="space-y-3 bg-saffron-100 ring-saffron-400/60">
      <p className="font-semibold">{t.mockTitle}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => void send("SUCCESS")} disabled={busy}>
          {t.mockApprove}
        </Button>
        <Button variant="secondary" onClick={() => void send("FAILED")} disabled={busy}>
          {t.mockDecline}
        </Button>
      </div>
      {message && <Alert tone="info">{message}</Alert>}
    </Panel>
  );
}

export function PayPage() {
  const { reference = "" } = useParams();
  const { t } = useI18n();
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [slow, setSlow] = useState(false);
  const [round, setRound] = useState(0);
  const checkout = useMemo(() => readCheckout(reference), [reference]);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const controller = new AbortController();
    startedAt.current = Date.now();
    setGaveUp(false);
    setSlow(false);

    const tick = async () => {
      try {
        const next = await apiFetch<PaymentStatusResponse>(`/payments/status/${reference}`, { signal: controller.signal });
        if (cancelled) return;
        setStatus(next);
        if (next.status === "SUCCESS" || FAILED.has(next.status)) return;
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          setMissing(true);
          return;
        }
        // A dropped connection should not end the wait. Keep trying.
      }
      const waited = Date.now() - startedAt.current;
      if (waited > GIVE_UP_MS) {
        setGaveUp(true);
        return;
      }
      if (waited > SLOW_HINT_MS) setSlow(true);
      timer = window.setTimeout(() => void tick(), POLL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [reference, round]);

  const recheck = useCallback(() => setRound((n) => n + 1), []);
  const retryTo = checkout ? `/buy/${checkout.packageId}` : "/";

  if (missing) {
    return (
      <div className="space-y-3">
        <Alert tone="warning">{t.passUnavailable}</Alert>
        <Link to="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-lagoon-700 px-5 font-semibold text-white hover:bg-lagoon-800">
          {t.choosePass}
        </Link>
      </div>
    );
  }

  if (!status) {
    return (
      <Panel className="py-10">
        <PulseIcon />
      </Panel>
    );
  }

  if (status.status === "SUCCESS") {
    return <SuccessView title={t.paidTitle} packageName={status.packageName} expiresAt={status.expiresAt} subscriptionId={status.subscriptionId} />;
  }

  if (FAILED.has(status.status)) {
    const body =
      status.status === "EXPIRED" ? t.expiredBody : status.status === "CANCELLED" ? t.cancelledBody : t.failedBody;
    return (
      <div className="space-y-4">
        <Panel className="space-y-3 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-red-50 text-red-700" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-8" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{t.failedTitle}</h2>
          <p className="text-ink-950/70">{body}</p>
          {status.failureReason && <p className="text-sm text-ink-950/55">{status.failureReason}</p>}
        </Panel>
        <ReferenceBox reference={status.reference} />
        <Link to={retryTo} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-lagoon-700 px-5 font-semibold text-white hover:bg-lagoon-800">
          {t.tryAgain}
        </Link>
        <Link to="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-lagoon-800 hover:bg-lagoon-50">
          {t.choosePass}
        </Link>
      </div>
    );
  }

  const phoneText = checkout ? formatLocalPhone(checkout.phone) : null;

  return (
    <div className="space-y-4">
      <Panel className="space-y-5">
        <PulseIcon />
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{gaveUp ? t.timeoutTitle : t.pendingTitle}</h2>
          {phoneText && !gaveUp && <p className="mt-1 text-sm text-ink-950/60 tabular-nums">{maskPhone(checkout!.phone)}</p>}
        </div>

        {gaveUp ? (
          <>
            <p className="text-center text-ink-950/70">{t.timeoutBody}</p>
            <ReferenceBox reference={status.reference} />
            <Button variant="secondary" onClick={recheck}>
              {t.checkAgain}
            </Button>
          </>
        ) : (
          <>
            <ol className="space-y-3">
              {[t.step1(phoneText ?? t.yourPhone), t.step2(formatTzs(status.amountTzs))].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lagoon-100 text-sm font-bold text-lagoon-800 tabular-nums">{index + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-ink-950/60">{t.autoUpdate}</p>
            {slow && <Alert tone="info">{t.slowHint}</Alert>}
            {slow && (
              <Link to={retryTo} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 font-semibold text-lagoon-800 ring-1 ring-inset ring-ink-950/15 hover:bg-lagoon-50">
                {t.startOver}
              </Link>
            )}
          </>
        )}
      </Panel>

      {status.providerCode === "MOCK" && !gaveUp && <MockPanel reference={status.reference} onDone={recheck} />}
    </div>
  );
}
