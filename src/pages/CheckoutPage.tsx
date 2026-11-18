import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Ticket } from "../components/Ticket";
import { Alert, Button, Field, Panel, Spinner, inputClass } from "../components/ui";
import { usePortalData } from "../data/PortalData";
import { useI18n } from "../i18n";
import { ApiError, apiFetch, type InitiatedPayment } from "../lib/api";
import { formatTzs } from "../lib/format";
import { normalizeTanzanianPhone } from "../lib/phone";
import { writeStore } from "../lib/storage";
import { uuid } from "../lib/uuid";

const PROVIDER_CODE = "CLICKPESA";

function BackLink() {
  const { t } = useI18n();
  return (
    <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lagoon-800 hover:underline">
      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
        <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {t.back}
    </Link>
  );
}

export function CheckoutPage() {
  const { packageId } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { status, packages, config, reload } = usePortalData();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Keep the key stable across retries of the same payment attempt.
  const idempotencyKey = useRef(uuid());

  const pkg = packages.find((p) => p.id === packageId);
  const clickPesaAvailable = config?.providers.some((p) => p.code === PROVIDER_CODE) ?? false;

  if (status === "loading") {
    return (
      <div role="status" className="flex min-h-[calc(100dvh-8rem)] items-center justify-center gap-3 text-ink-950/70 lg:min-h-0">
        <Spinner className="size-5 text-lagoon-700" />
        {t.loading}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-3">
        <BackLink />
        <Alert>{t.passesError}</Alert>
        <Button variant="secondary" onClick={reload}>
          {t.retry}
        </Button>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="space-y-3">
        <BackLink />
        <Alert tone="warning">{t.passUnavailable}</Alert>
        <Link to="/" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-lagoon-700 px-5 font-semibold text-white hover:bg-lagoon-800">
          {t.choosePass}
        </Link>
      </div>
    );
  }

  const price = formatTzs(pkg.priceTzs);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeTanzanianPhone(phone);
    if (!normalized) {
      setPhoneError(t.phoneInvalid);
      return;
    }
    setPhoneError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payment = await apiFetch<InitiatedPayment>("/payments/initiate", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ packageId: pkg.id, phoneNumber: normalized, providerCode: PROVIDER_CODE }),
      });
      writeStore(`zubix.checkout.${payment.reference}`, JSON.stringify({ packageId: pkg.id, phone: normalized }));
      navigate(`/pay/${payment.reference}`);
    } catch (error) {
      setSubmitError(error instanceof ApiError && error.status !== 0 ? error.message : t.passesError);
      setSubmitting(false);
    }
  };

  return (
    <>
      <BackLink />
      <Ticket pkg={pkg} />

      <ul className="grid grid-cols-3 gap-3" aria-label="Supported mobile money networks">
        {[
          { name: "Airtel Money", src: "/airtel.png" },
          { name: "HaloPesa", src: "/halopesa1.png" },
          { name: "Yas", src: "/yas.png" },
        ].map((network) => (
          <li key={network.name} className="flex h-14 items-center justify-center rounded-xl bg-white px-3 py-2 ring-1 ring-ink-950/5">
            <img src={network.src} alt={network.name} className="max-h-full max-w-full object-contain" />
          </li>
        ))}
      </ul>

      <Panel>
        {!clickPesaAvailable ? (
          <Alert tone="warning">{t.noProviders}</Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <Field label={t.phoneLabel} hint={t.phoneHint} error={phoneError} htmlFor="phone">
              <div
                className={`flex overflow-hidden rounded-xl bg-white ring-1 ring-inset focus-within:ring-2 focus-within:ring-lagoon-700 ${
                  phoneError ? "ring-red-500" : "ring-ink-950/15"
                }`}
              >
                <span className="flex items-center bg-lagoon-50 px-3.5 text-lg font-semibold tabular-nums text-lagoon-800">+255</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="0712 345 678"
                  value={phone}
                  aria-invalid={phoneError ? true : undefined}
                  aria-describedby={phoneError ? "phone-error" : "phone-hint"}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError(null);
                    idempotencyKey.current = uuid();
                  }}
                  className={`${inputClass} rounded-none ring-0 focus:ring-0`}
                />
              </div>
            </Field>

            {submitError && <Alert>{submitError}</Alert>}

            <Button type="submit" loading={submitting}>
              {submitting ? t.paying : t.pay(price)}
            </Button>
          </form>
        )}
      </Panel>
    </>
  );
}
