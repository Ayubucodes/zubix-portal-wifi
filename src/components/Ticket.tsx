import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { formatTzs } from "../lib/format";
import type { PublicPackage } from "../lib/api";

/**
 * A package drawn as a tear-off pass: the length of time on the stub, the details and price on the body,
 * a perforation between them. Without `to` it is a plain recap (used on the checkout screen).
 */
export function Ticket({ pkg, best = false, to }: { pkg: PublicPackage; best?: boolean; to?: string }) {
  const { t } = useI18n();
  const price = formatTzs(pkg.priceTzs);
  const features = [
    pkg.dataLimitMb ? t.dataLimit(pkg.dataLimitMb) : t.unlimitedData,
    pkg.downloadKbps ? t.speedUpTo(pkg.downloadKbps) : null,
    t.devices(pkg.maxDevices),
  ].filter((value): value is string => value !== null);

  const body: ReactNode = (
    <>
      {best && (
        <span className="absolute right-4 top-0 rounded-b-lg bg-saffron-400 px-2.5 py-1 text-xs font-bold text-ink-950">{t.bestValue}</span>
      )}
      <div className="flex w-28 shrink-0 flex-col items-center justify-center bg-lagoon-50 px-2 py-6 text-center">
        <span className="font-display text-5xl font-extrabold leading-none tabular-nums text-ink-950">{pkg.durationValue}</span>
        <span className="mt-1.5 text-sm font-semibold text-lagoon-800">{t.unit(pkg.durationUnit, pkg.durationValue)}</span>
      </div>

      <div aria-hidden className="relative w-0 border-l-2 border-dashed border-lagoon-600/30">
        <span className="absolute -left-[11px] -top-[11px] size-[22px] rounded-full bg-paper" />
        <span className="absolute -bottom-[11px] -left-[11px] size-[22px] rounded-full bg-paper" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 pt-5">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-950">{pkg.name}</p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-ink-950/65">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="font-display text-2xl font-extrabold leading-none tabular-nums">{price}</span>
          {to && (
            <span className="inline-flex min-h-10 items-center rounded-full bg-lagoon-700 px-5 text-sm font-semibold text-white transition-colors group-hover:bg-lagoon-800">
              {t.buy}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const shared = "relative flex overflow-hidden rounded-2xl bg-white ring-1 ring-ink-950/5";
  if (!to) return <div className={shared}>{body}</div>;
  return (
    <Link to={to} aria-label={`${pkg.name}: ${t.buyFor(price)}`} className={`group ${shared} transition-shadow hover:ring-2 hover:ring-lagoon-600`}>
      {body}
    </Link>
  );
}
