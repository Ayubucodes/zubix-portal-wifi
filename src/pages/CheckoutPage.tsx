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

type ProviderCode = "SELCOM" | "CLICKPESA" | "MOCK";

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
  const [provider, setProvider] = useState<ProviderCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // One key per attempt, so a retry after a dropped connection cannot charge twice.
  // It changes whenever the phone number or provider changes, because that is a different payment.
  const idempotencyKey = useRef(uuid());

  const pkg = packages.find((p) => p.id === packageId);
  const providers = config?.providers ?? [];
  const selectedProvider: ProviderCode | null = provider ?? providers[0]?.code ?? null;

  if (status === "loading") {
    return (
      <div role="status" className="flex items-center justify-center gap-3 py-10 text-ink-950/70">
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
  const hasMock = providers.some((p) => p.code === "MOCK");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeTanzanianPhone(phone);
    if (!normalized) {
      setPhoneError(t.phoneInvalid);
      return;
    }
    if (!selectedProvider) return;
    setPhoneError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payment = await apiFetch<InitiatedPayment>("/payments/initiate", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ packageId: pkg.id, phoneNumber: normalized, providerCode: selectedProvider }),
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

      <Panel>
        {providers.length === 0 ? (
          <Alert tone="warning">{t.noProviders}</Alert>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {hasMock && selectedProvider === "MOCK" && <Alert tone="warning">{t.testBanner}</Alert>}

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

            {providers.length > 1 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">{t.payWith}</legend>
                {providers.map((p) => (
                  <label
                    key={p.code}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-4 ring-1 ring-inset ${
                      selectedProvider === p.code ? "bg-lagoon-50 ring-2 ring-lagoon-700" : "ring-ink-950/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p.code}
                      checked={selectedProvider === p.code}
                      onChange={() => {
                        setProvider(p.code);
                        idempotencyKey.current = uuid();
                      }}
                      className="size-4 accent-lagoon-700"
                    />
                    {p.code === "MOCK" ? t.providerMock : t.providerMobile}
                  </label>
                ))}
              </fieldset>
            )}

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
