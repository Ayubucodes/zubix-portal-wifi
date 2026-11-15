import { useState, type FormEvent } from "react";
import { SuccessView } from "../components/SuccessView";
import { TabBar } from "../components/TabBar";
import { Alert, Button, Field, Panel, inputClass } from "../components/ui";
import { useI18n } from "../i18n";
import { ApiError, apiFetch, type RedeemResponse } from "../lib/api";
import { normalizeTanzanianPhone } from "../lib/phone";

export function VoucherPage() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RedeemResponse | null>(null);

  if (result) {
    return (
      <SuccessView title={t.voucherAcceptedTitle} packageName={result.packageName} expiresAt={result.expiresAt} subscriptionId={result.subscriptionId} />
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    const normalizedPhone = normalizeTanzanianPhone(phone);
    setCodeError(trimmed.length < 6 ? t.voucherCodeInvalid : null);
    setPhoneError(normalizedPhone ? null : t.phoneInvalid);
    if (trimmed.length < 6 || !normalizedPhone) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      setResult(await apiFetch<RedeemResponse>("/vouchers/redeem", { method: "POST", body: JSON.stringify({ code: trimmed, phone: normalizedPhone }) }));
    } catch (error) {
      setSubmitError(error instanceof ApiError && error.status !== 0 ? error.message : t.passesError);
      setSubmitting(false);
    }
  };

  return (
    <>
      <TabBar />
      <Panel>
        <h2 className="mb-5 font-display text-xl font-extrabold tracking-tight">{t.voucherTitle}</h2>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <Field label={t.voucherCode} hint={t.voucherCodeHint} error={codeError} htmlFor="code">
            <input
              id="code"
              name="code"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={32}
              value={code}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? "code-error" : "code-hint"}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError(null);
              }}
              className={`${inputClass} font-display font-bold uppercase tracking-widest tabular-nums`}
            />
          </Field>

          <Field label={t.voucherPhone} hint={t.voucherPhoneHint} error={phoneError} htmlFor="voucher-phone">
            <input
              id="voucher-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="0712 345 678"
              value={phone}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? "voucher-phone-error" : "voucher-phone-hint"}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              className={`${inputClass} tabular-nums`}
            />
          </Field>

          {submitError && <Alert>{submitError}</Alert>}

          <Button type="submit" loading={submitting}>
            {submitting ? t.redeeming : t.redeem}
          </Button>
        </form>
      </Panel>
    </>
  );
}
